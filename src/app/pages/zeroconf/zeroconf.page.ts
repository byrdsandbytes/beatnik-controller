import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ZeroConf, ZeroConfService as ZeroConfServiceModel } from 'capacitor-zeroconf';
import { ZeroconfService } from '../../services/zero-conf.service';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../../enum/user-preference.enum';
import { AlertController } from '@ionic/angular';


@Component({
  selector: 'app-zeroconf',
  templateUrl: './zeroconf.page.html',
  styleUrls: ['./zeroconf.page.scss'],
  standalone: false,
})
export class ZeroconfPage implements OnDestroy {
  services$: Observable<ZeroConfServiceModel[]>;
  readonly SERVICE_SNAPCAST = '_snapcast._tcp.';
  readonly SERVICE_BEATNIK = '_beatnik._tcp.';
  isScanning = false;


  constructor(private zeroconf: ZeroconfService,
    private alertController: AlertController
  ) {
    this.services$ = this.zeroconf.services$;
  }

  async ngOnInit() {

  }

  async scanForServices(): Promise<void> {
    this.isScanning = true;
    try {
      await this.zeroconf.watchMultiple([this.SERVICE_SNAPCAST, this.SERVICE_BEATNIK]);
      console.log(`Started scanning for services of types: ${this.SERVICE_SNAPCAST}, ${this.SERVICE_BEATNIK}`);
    }
    catch (error) {
      console.error('Error starting service scan:', error);
    }
  }

  async getHostname(): Promise<void> {
    try {
      const result = await ZeroConf.getHostname();
      console.log('Hostname:', result.hostname);
    } catch (error) {
      console.error('Error getting hostname:', error);
    }
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
    try {
      await this.zeroconf.stop();
      console.log('Stopped scanning for services.');
    } catch (error) {
      console.error('Error stopping service scan:', error);
    }
  }

  async setAsServer(service: ZeroConfServiceModel): Promise<void> {
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

  private async saveServerUrl(service: ZeroConfServiceModel): Promise<void> {
    const url = service.ipv4Addresses[0];
    await Preferences.set({
      key: UserPreference.SERVER_URL,
      value: url,
    });
    console.log('Server URL set to:', url); 

  }

  // Example of publishing a service
  // this.zeroconf.publish({
  //   type: '_my-app._tcp.',
  //   name: 'My Angular App',
  //   port: 8080
  // });


  // Clean up when the component is destroyed
  ngOnDestroy() {
    this.stopScan();
  }


}
