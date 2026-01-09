import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CamillaDspConfig, MixerSource, SignalLevels } from 'src/app/model/camilla-dsp.model';
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

    private levelSubscription: Subscription | undefined;

    constructor(private camillaService: CamillaDspService) { }

    ngOnInit() {
        this.connect();
        // Subscribe to connection status changes
        this.subscriptions.add(
            this.camillaService.connectionStatus$.subscribe(status => {
                this.connectionStatus = status;
                this.getConfigJson();

            })
        );

        // Subscribe to incoming messages
        this.subscriptions.add(
            this.camillaService.messages$.subscribe(message => {
                console.log('Received message in component:', message);
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
                    this.levels = message.GetSignalLevels.value;
                    console.log('Signal Levels received:', this.levels);
                }
            })
        );

        this.levelSubscription = this.camillaService.signalLevels$.subscribe(levels => {
            // Service handles normalization, so we get the raw levels object directly
            this.levels = levels;
        });

        // timeout to allow UI to update
        setTimeout(() => {
            this.getCaptureSignalLevels();

        }, 400);
    }

    connect() {
        this.camillaService.connect(this.url);
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
}
