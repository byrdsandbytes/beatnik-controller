import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Subscription } from 'rxjs';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { CamillaDspConfig, MixerSource, Processor, SignalLevels } from 'src/app/model/camilla-dsp.model';
import { BeatnikHardwareService } from 'src/app/services/beatnik-hardware.service';
import { CamillaDspService, ConnectionStatus } from 'src/app/services/camilla-dsp.service';

interface ProcessorControl {
    key: string;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    digits: string;
}

@Component({
    selector: 'app-camilla-dsp',
    templateUrl: './camilla-dsp.component.html',
    styleUrls: ['./camilla-dsp.component.scss'],
    standalone: false
})
export class CamillaDspComponent implements OnInit, OnDestroy {

    @Input() url: string = 'ws://beatnik-server.local:1234';

    // 'linein' manages the preamp CamillaDSP configs instead of the playback ones
    @Input() mode: 'playback' | 'linein' = 'playback';

    connectionStatus: ConnectionStatus = 'Disconnected';
    lastMessage: any = { message: 'No messages received yet.' };
    private subscriptions = new Subscription();
    private configJson: any = null;
    parsedConfig: CamillaDspConfig | null = null;

    levels: SignalLevels | null = null;
    currentVolume: number = 0;
    availableCamillaConfigs: string[] = [];
    selectedCamillaConfig: string | null = null;
    currentCamillaConfigFile: string | null = null;
    isLoadingCamillaConfigs = false;
    isSavingCamillaConfig = false;
    camillaConfigMessage = '';
    camillaConfigError = '';
    isConfigPickerOpen = false;
    configSearchTerm = '';
    meterStyle: 'bars' | 'vu' = 'bars';
    controlStyle: 'lines' | 'rotary' = 'lines';
    private processorSendTimer?: ReturnType<typeof setTimeout>;

    readonly dynamicsControls: ProcessorControl[] = [
        { key: 'threshold', label: 'Threshold', unit: 'dB', min: -60, max: 0, step: 0.5, digits: '1.0-1' },
        { key: 'factor', label: 'Ratio', unit: ':1', min: 1, max: 20, step: 0.1, digits: '1.0-1' },
        { key: 'attack', label: 'Attack', unit: 's', min: 0.001, max: 1, step: 0.001, digits: '1.0-3' },
        { key: 'release', label: 'Release', unit: 's', min: 0.01, max: 2, step: 0.01, digits: '1.0-2' }
    ];

    readonly outputControls: ProcessorControl[] = [
        { key: 'makeup_gain', label: 'Makeup gain', unit: 'dB', min: 0, max: 24, step: 0.5, digits: '1.0-1' }
    ];

    readonly clipLimitControl: ProcessorControl =
        { key: 'clip_limit', label: 'Clip limit', unit: 'dB', min: -24, max: 0, step: 0.5, digits: '1.0-1' };

    get filteredCamillaConfigs(): string[] {
        const searchTerm = this.configSearchTerm.trim().toLowerCase();
        return this.availableCamillaConfigs.filter(config => config.toLowerCase().includes(searchTerm));
    }

    constructor(
        private camillaService: CamillaDspService,
        private beatnikHardwareService: BeatnikHardwareService
    ) { }

    async onMeterStyleChange(style: string | number | undefined) {
        if (style !== 'bars' && style !== 'vu') {
            return;
        }

        this.meterStyle = style;
        await Preferences.set({ key: UserPreference.SIGNAL_METER_STYLE, value: style });
    }

    async onControlStyleChange(style: string | number | undefined) {
        if (style !== 'lines' && style !== 'rotary') {
            return;
        }

        this.controlStyle = style;
        await Preferences.set({ key: UserPreference.CONTROL_STYLE, value: style });
    }

    private async loadStylePreferences() {
        const meter = await Preferences.get({ key: UserPreference.SIGNAL_METER_STYLE });
        if (meter.value === 'bars' || meter.value === 'vu') {
            this.meterStyle = meter.value;
        }

        const control = await Preferences.get({ key: UserPreference.CONTROL_STYLE });
        if (control.value === 'lines' || control.value === 'rotary') {
            this.controlStyle = control.value;
        }
    }

    async ngOnInit() {
        this.loadStylePreferences();
        this.loadCamillaConfigState();
        this.connect();
        // Subscribe to connection status changes
        this.subscriptions.add(
            this.camillaService.connectionStatus$.subscribe(status => {
                this.connectionStatus = status;
                if (status === 'Connected') {
                    // Fetch initial state and config upon connection
                    this.getConfigJson();
                    this.getCaptureSignalLevels();

                }

            })
        );

        // Subscribe to incoming messages
        this.subscriptions.add(
            this.camillaService.messages$.subscribe(message => {
                // console.log('Received message in component:', message);
                this.lastMessage = message;
                if (message.GetConfigJson) {
                    console.log('Config JSON received:', message.GetConfigJson);
                    this.configJson = message.GetConfigJson.value;
                    console.log('Unparsed Config JSON:', this.configJson);
                    try {
                        this.configJson = JSON.parse(this.configJson);
                        console.log('Parsed Config JSON:', this.configJson);
                        this.parsedConfig = this.configJson;
                    } catch (error) {
                        console.error('Error parsing Config JSON:', error);
                    }
                } else if (message.GetSignalLevels) {
                    // this.levels = message.GetSignalLevels.value;
                    // console.log('Signal Levels received:', this.levels);
                } else if (message.GetVolume) {
                    this.currentVolume = message.GetVolume.value;
                }
            })
        );

        this.subscriptions.add(
            this.camillaService.signalLevels$.subscribe(levels => {
                // Service handles normalization, so we get the raw levels object directly
                this.levels = levels;
            })
        );
    }

    private getHardwareHost(): string | null {
        if (!this.url) {
            return null;
        }

        try {
            return new URL(this.url).hostname;
        } catch (error) {
            console.error('Failed to parse CamillaDSP URL for hardware API access:', error);
            return null;
        }
    }

    loadCamillaConfigState() {
        const host = this.getHardwareHost();
        if (!host) {
            this.camillaConfigError = 'Unable to determine device host for CamillaDSP config API.';
            return;
        }

        this.isLoadingCamillaConfigs = true;
        this.camillaConfigError = '';
        this.camillaConfigMessage = '';

        this.subscriptions.add(
            (this.mode === 'linein'
                ? this.beatnikHardwareService.getLineInConfigs(host)
                : this.beatnikHardwareService.getCamillaConfigs(host)).subscribe({
                next: (response) => {
                    this.availableCamillaConfigs = response.configs ?? [];
                    this.syncSelectedCamillaConfig();
                    this.isLoadingCamillaConfigs = false;
                },
                error: (error) => {
                    console.error('Failed to load available CamillaDSP configs:', error);
                    this.camillaConfigError = 'Failed to load available CamillaDSP configs.';
                    this.isLoadingCamillaConfigs = false;
                }
            })
        );

        this.subscriptions.add(
            (this.mode === 'linein'
                ? this.beatnikHardwareService.getLineInDefaultConfig(host)
                : this.beatnikHardwareService.getDefaultCamillaConfig(host)).subscribe({
                next: (response) => {
                    this.currentCamillaConfigFile = response.fileName;
                    this.syncSelectedCamillaConfig();
                },
                error: (error) => {
                    console.error('Failed to load default CamillaDSP config:', error);
                    this.camillaConfigError = 'Failed to load current default CamillaDSP config.';
                }
            })
        );
    }

    private syncSelectedCamillaConfig() {
        if (this.currentCamillaConfigFile && this.availableCamillaConfigs.includes(this.currentCamillaConfigFile)) {
            this.selectedCamillaConfig = this.currentCamillaConfigFile;
            return;
        }

        if (!this.selectedCamillaConfig && this.availableCamillaConfigs.length > 0) {
            this.selectedCamillaConfig = this.availableCamillaConfigs[0];
        }
    }

    openConfigPicker() {
        this.configSearchTerm = '';
        this.isConfigPickerOpen = true;
    }

    closeConfigPicker() {
        this.isConfigPickerOpen = false;
    }

    selectCamillaConfig(config: string) {
        if (this.isLoadingCamillaConfigs || this.isSavingCamillaConfig) {
            return;
        }

        this.selectedCamillaConfig = config;
        this.closeConfigPicker();
    }

    saveDefaultCamillaConfig() {
        const host = this.getHardwareHost();

        if (!host || !this.selectedCamillaConfig) {
            this.camillaConfigError = 'Please choose a CamillaDSP config before saving.';
            return;
        }

        this.isSavingCamillaConfig = true;
        this.camillaConfigError = '';
        this.camillaConfigMessage = '';

        this.subscriptions.add(
            (this.mode === 'linein'
                ? this.beatnikHardwareService.setLineInDefaultConfig(this.selectedCamillaConfig, host)
                : this.beatnikHardwareService.setDefaultCamillaConfig(this.selectedCamillaConfig, host)).subscribe({
                next: (response) => {
                    this.currentCamillaConfigFile = response.fileName;
                    this.selectedCamillaConfig = response.fileName;
                    this.camillaConfigMessage = `Default config set to ${response.fileName}.` +
                        (response.camillaRestarted ? ' CamillaDSP restarted.' : '');
                    this.isSavingCamillaConfig = false;
                },
                error: (error) => {
                    console.error('Failed to update default CamillaDSP config:', error);
                    this.camillaConfigError = error?.error?.error ?? 'Failed to update default CamillaDSP config.';
                    this.isSavingCamillaConfig = false;
                }
            })
        );
    }



    connect() {
        return this.camillaService.connect(this.url);
    }

    disconnect() {
        this.camillaService.disconnect();
    }

    getState() {
        this.camillaService.sendCommand('GetState');
    }

    getConfigJson() {
        this.camillaService.sendCommand('GetConfigJson');
    }

    getConfigYaml() {
        this.camillaService.sendCommand('GetConfig');
    }

    // onParameterChange(filter.key, param.key, param.value)
    updateFilterParameter(filterKey: string, paramKey: string, newValue: any) {
        if (!this.parsedConfig) {
            console.error('No configuration loaded.');
            return;
        }

        const filter = this.parsedConfig.filters[filterKey];
        if (!filter) {
            console.error(`Filter with key ${filterKey} not found.`);
            return;
        }

        // Update the parameter locally
        (filter.parameters as any)[paramKey] = newValue;

        // format the conffigJson to send to CamillaDSP
        console.log('Updated filter parameter:', filterKey, paramKey, newValue);
        console.log('Updated configuration to send:', this.parsedConfig);

        // send the full configJson back to CamillaDSP
        this.camillaService.sendCommand('SetConfigJson', JSON.stringify(this.parsedConfig));

    }

    updateMixerMapping(mixerSource: MixerSource, mixerKey: string) {
        if (!this.parsedConfig) {
            console.error('No configuration loaded.');
            return;
        }

        // Send the full configJson back to CamillaDSP
        this.camillaService.sendCommand('SetConfigJson', JSON.stringify(this.parsedConfig));
    }

    getUpdateInterval() {
        this.camillaService.sendCommand('GetUpdateInterval');
    }

    getCaptureSignalLevels() {
        // Use the server-side push mechanism instead of polling
        this.camillaService.startLevelUpdates(50);
    }

    setUpdateInterval(interval: number) {
        this.camillaService.startLevelUpdates(interval);
    }

    getVolume() {
        // Response is applied reactively via the messages$ subscription in ngOnInit
        this.camillaService.sendCommand('GetVolume');
    }

    setVolume(volume: number) {
        this.camillaService.sendCommand('SetVolume', volume);
    }

    ngOnDestroy() {
        clearTimeout(this.processorSendTimer);
        // Disconnect before unsubscribing so no late message/status update fires after teardown
        this.camillaService.disconnect();
        this.subscriptions.unsubscribe();
    }

    getProcessorParam(processor: Processor, paramKey: string): any {
        return (processor.parameters as any)[paramKey];
    }

    formatChannels(channels: number | number[] | null | undefined): string {
        if (channels === null || channels === undefined) {
            return 'All';
        }

        return Array.isArray(channels) ? channels.join(', ') : String(channels);
    }

    onProcessorNumberChange(processorKey: string, paramKey: string, rawValue: unknown) {
        const value = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
        if (Number.isFinite(value)) {
            this.updateProcessorParameter(processorKey, paramKey, value);
        }
    }

    updateProcessorParameter(processorKey: string, paramKey: string, newValue: any) {
        if (!this.parsedConfig) {
            console.error('No configuration loaded.');
            return;
        }

        const processor = this.parsedConfig.processors?.[processorKey];
        if (!processor) {
            console.error(`Processor with key ${processorKey} not found.`);
            return;
        }

        if (this.getProcessorParam(processor, paramKey) === newValue) {
            return;
        }

        (processor.parameters as any)[paramKey] = newValue;

        // Applying a config restarts the pipeline, so wait until dragging settles
        clearTimeout(this.processorSendTimer);
        this.processorSendTimer = setTimeout(() => {
            this.camillaService.sendCommand('SetConfigJson', JSON.stringify(this.parsedConfig));
        }, 250);
    }

   
}
