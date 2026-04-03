import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CamillaDspConfig, MixerSource, SignalLevels } from 'src/app/model/camilla-dsp.model';
import { BeatnikHardwareService } from 'src/app/services/beatnik-hardware.service';
import { CamillaDspService, ConnectionStatus } from 'src/app/services/camilla-dsp.service';

@Component({
    selector: 'app-camilla-dsp',
    templateUrl: './camilla-dsp.component.html',
    styleUrls: ['./camilla-dsp.component.scss'],
    standalone: false
})
export class CamillaDspComponent implements OnInit, OnDestroy {

    @Input() url: string = 'ws://beatnik-server.local:1234';

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

    private levelSubscription: Subscription | undefined;

    constructor(
        private camillaService: CamillaDspService,
        private beatnikHardwareService: BeatnikHardwareService
    ) { }

    async ngOnInit() {
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
                }
            })
        );

        this.levelSubscription = this.camillaService.signalLevels$.subscribe(levels => {
            // Service handles normalization, so we get the raw levels object directly
            this.levels = levels;
        });

        // timeout to allow UI to update
        // setTimeout(() => {
        //     this.getCaptureSignalLevels();

        // }, 800);
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
            this.beatnikHardwareService.getCamillaConfigs(host).subscribe({
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
            this.beatnikHardwareService.getDefaultCamillaConfig(host).subscribe({
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
            this.beatnikHardwareService.setDefaultCamillaConfig(this.selectedCamillaConfig, host).subscribe({
                next: (response) => {
                    this.currentCamillaConfigFile = response.fileName;
                    this.selectedCamillaConfig = response.fileName;
                    this.camillaConfigMessage = `Default config set to ${response.fileName}.`;
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
        this.camillaService.sendCommand('GetVolume');
        this.currentVolume = this.lastMessage.GetVolume?.value ?? this.currentVolume;
        console.log('Current volume:', this.currentVolume);
    }

    setVolume(volume: number) {
        this.camillaService.sendCommand('SetVolume', volume);
    }

    ngOnDestroy() {
        // Clean up subscriptions to prevent memory leaks
        this.subscriptions.unsubscribe();
        // Tell server to stop sending updates
        this.camillaService.stopLevelUpdates();
        this.camillaService.disconnect();
    }

    ionViewWillLeave() {
        console.log('CamillaDspComponent: Leaving page, cleaning up resources if needed');
        this.ngOnDestroy();
    }

   
}
