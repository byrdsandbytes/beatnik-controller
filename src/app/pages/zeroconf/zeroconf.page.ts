import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
// import { ZeroConf, ZeroConfService as ZeroConfServiceModel } from 'capacitor-zeroconf';
// import { ZeroconfService } from '../../services/zero-conf.service';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../../enum/user-preference.enum';
import { AlertController } from '@ionic/angular';
import { MdnsDiscoverResult, MdnsService } from '@byrds/capacitor-mdns';
import { CapMdnsService } from 'src/app/services/cap-mdns.service';




@Component({
  selector: 'app-zeroconf',
  templateUrl: './zeroconf.page.html',
  styleUrls: ['./zeroconf.page.scss'],
  standalone: false,
})
export class ZeroconfPage implements OnInit, OnDestroy {
  // services$: Observable<ZeroConfServiceModel[]>;
  readonly SERVICE_SNAPCAST = '_snapcast._tcp.';
  readonly SERVICE_BEATNIK = '_beatnik._tcp.';
  isScanning = false;
  beatnikmdnsResults: MdnsDiscoverResult;
  snapcastmdnsResults: MdnsDiscoverResult;


  constructor(
    // private zeroconf: ZeroconfService,
    private alertController: AlertController,
    private capMdnsService: CapMdnsService
  ) {
    // this.services$ = this.zeroconf.services$;
  }

  async ngOnInit() {

  }

  ngOnDestroy() {
    this.isScanning = false;
    this.beatnikmdnsResults = null;
    this.snapcastmdnsResults = null;
  }

  async scanForServices(): Promise<void> {
    this.isScanning = true;
    try {
      // await this.zeroconf.watchMultiple([this.SERVICE_SNAPCAST, this.SERVICE_BEATNIK]);
      // console.log(`Started scanning for services of types: ${this.SERVICE_SNAPCAST}, ${this.SERVICE_BEATNIK}`);
      this.snapcastmdnsResults = await this.capMdnsService.discover({ type: this.SERVICE_SNAPCAST, timeout: 5000 });
      console.log('Discovered Snapcast services:', this.snapcastmdnsResults);
      this.beatnikmdnsResults = await this.capMdnsService.discover({ type: this.SERVICE_BEATNIK, timeout: 5000 });
      console.log('Discovered Beatnik services:', this.beatnikmdnsResults);
      this.isScanning = false;
    }
    catch (error) {
      console.error('Error starting service scan:', error);
      this.isScanning = false;
    }
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
    const url = service.hosts[0];
    await Preferences.set({
      key: UserPreference.SERVER_URL,
      value: url,
    });
    console.log('Server URL set to:', url); 
  }
  

 



}
