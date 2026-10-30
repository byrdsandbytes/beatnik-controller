import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../../enum/user-preference.enum';
import { AlertController } from '@ionic/angular';
import { mDNS, MdnsDiscoverResult, MdnsService } from '@byrds/capacitor-mdns';
import { PluginListenerHandle } from '@capacitor/core';
import { CapMdnsService } from 'src/app/services/cap-mdns.service';

@Component({
  selector: 'app-zeroconf',
  templateUrl: './zeroconf.page.html',
  styleUrls: ['./zeroconf.page.scss'],
  standalone: false,
})
export class ZeroconfPage implements OnInit, OnDestroy {
  readonly SERVICE_SNAPCAST = '_snapcast._tcp.';
  readonly SERVICE_BEATNIK = '_beatnik._tcp.';
  isScanning = false;
  beatnikmdnsResults: MdnsDiscoverResult | null = null;
  snapcastmdnsResults: MdnsDiscoverResult | null = null;

  private foundSub?: PluginListenerHandle;
  private lostSub?: PluginListenerHandle;

  constructor(
    private alertController: AlertController,
    private capMdnsService: CapMdnsService,
    private ngZone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {}

  async ngOnDestroy(): Promise<void> {
    await this.stopWatching();
    this.beatnikmdnsResults = null;
    this.snapcastmdnsResults = null;
  }

  async scanForServices(): Promise<void> {
    try {
      await this.stopWatching();

      this.isScanning = true;
      this.snapcastmdnsResults = this.toDiscoverResult([]);
      this.beatnikmdnsResults = this.toDiscoverResult([]);

      // 1. Listen for newly discovered services
      this.foundSub = await mDNS.addListener('serviceFound', ({ service }) => {
        this.ngZone.run(() => {
          this.handleServiceFound(service);
        });
      });

      // 2. Listen for vanished services
      this.lostSub = await mDNS.addListener('serviceLost', ({ service }) => {
        this.ngZone.run(() => {
          this.handleServiceLost(service);
        });
      });

      // 3. Start watching multiple service types at once
      const result = await mDNS.watchServices({
        types: [this.SERVICE_SNAPCAST, this.SERVICE_BEATNIK]
      });
      console.log(`Started ${result.watchersStarted} service watchers`);

      if (result.error) {
        console.error('Error starting watchers:', result.errorMessage);
        await this.stopWatching();
      }
    } catch (error) {
      console.error('Error starting service scan:', error);
      await this.stopWatching();
    }
  }

  async stopScanning(): Promise<void> {
    await this.stopWatching();
  }

  async stopWatching(): Promise<void> {
    this.isScanning = false;

    try {
      // 4. When done, stop watching and remove listeners
      await mDNS.stopWatching();
    } catch (error) {
      console.warn('Error stopping mDNS watcher:', error);
    }

    if (this.foundSub) {
      await this.foundSub.remove();
      this.foundSub = undefined;
    }

    if (this.lostSub) {
      await this.lostSub.remove();
      this.lostSub = undefined;
    }
  }

  private handleServiceFound(service: MdnsService): void {
    console.log(`Discovered ${service.type}: ${service.name} at ${service.hosts?.join(', ')}:${service.port}`);
    if (this.isServiceType(service.type, this.SERVICE_SNAPCAST)) {
      this.snapcastmdnsResults = this.toDiscoverResult(
        this.upsertService(this.snapcastmdnsResults?.services || [], service)
      );
    } else if (this.isServiceType(service.type, this.SERVICE_BEATNIK)) {
      this.beatnikmdnsResults = this.toDiscoverResult(
        this.upsertService(this.beatnikmdnsResults?.services || [], service)
      );
    }
  }

  private handleServiceLost(service: MdnsService): void {
    console.log(`Lost service: ${service.name} (${service.type})`);
    if (this.isServiceType(service.type, this.SERVICE_SNAPCAST)) {
      this.snapcastmdnsResults = this.toDiscoverResult(
        (this.snapcastmdnsResults?.services || []).filter(s => s.name !== service.name)
      );
    } else if (this.isServiceType(service.type, this.SERVICE_BEATNIK)) {
      this.beatnikmdnsResults = this.toDiscoverResult(
        (this.beatnikmdnsResults?.services || []).filter(s => s.name !== service.name)
      );
    }
  }

  private toDiscoverResult(services: MdnsService[]): MdnsDiscoverResult {
    return {
      error: false,
      errorMessage: null,
      servicesFound: services.length,
      services
    };
  }

  private isServiceType(actualType: string, expectedType: string): boolean {
    const normalize = (t: string) => (t.endsWith('.') ? t : `${t}.`).toLowerCase();
    return normalize(actualType) === normalize(expectedType);
  }

  private upsertService(services: MdnsService[], service: MdnsService): MdnsService[] {
    const index = services.findIndex(s => s.name === service.name);
    if (index >= 0) {
      const updated = [...services];
      updated[index] = service;
      return updated;
    }
    return [...services, service];
  }

  async setAsServer(service: MdnsService): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Set Snapcast Server',
      message: `Do you want to set ${service.name} as the Snapcast server?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Set as Server',
          handler: async () => {
             await this.saveServerUrl(service);
          }
        }
      ]
    });

    await alert.present();
  }

  private async saveServerUrl(service: MdnsService): Promise<void> {
    const url = service.hosts?.[0] || '';
    await Preferences.set({
      key: UserPreference.SERVER_URL,
      value: url,
    });
    console.log('Server URL set to:', url); 
  }
}
