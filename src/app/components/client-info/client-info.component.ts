import { Component, Input, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom, Observable } from 'rxjs';
import { SUPPORTED_HATS } from 'src/app/constant/hat.constant';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { SnapCastServerStatusResponse, Client } from 'src/app/model/snapcast.model';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';
import { BeatnikSnapcastService, SnapcastActionResponse } from 'src/app/services/beatnik-snapcast.service';
import { CamillaDspService } from 'src/app/services/camilla-dsp.service';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { SoundcardPickerComponent } from '../soundcard-picker/soundcard-picker.component';
import { AlertController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-client-info',
  templateUrl: './client-info.component.html',
  styleUrls: ['./client-info.component.scss'],
  standalone: false
})
export class ClientInfoComponent implements OnInit {
  @Input() client?: Client;

  serverState?: Observable<SnapCastServerStatusResponse>;
  segment: 'details' | 'soundcard' | 'camilla-dsp' | 'settings' = 'camilla-dsp';
  hardwareStatus$: Observable<HardwareStatus>;
  hats = Object.values(SUPPORTED_HATS);
  camillaDspUrl: string = '';
  snapcastServerStatus?: SnapcastActionResponse;




  constructor(
    private snapcastService: SnapcastService,
    private modalController: ModalController,
    private beatnikHardwareService: BeatnikHardwareService,
    private beatnikSnapcastService: BeatnikSnapcastService,
    private camillaService: CamillaDspService,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    this.serverState = this.snapcastService.state$;
    this.camillaDspUrl = await this.getCamillaDspUrl();
    this.getHardwareInfo();
  }


  async getCamillaDspUrl(): Promise<string> {
    if (!this.client) {
      console.error('Client Info Component: No client available to get Camilla DSP URL');
      return '';
    }
    var ipAddress = this.cleanIpAddress(this.client.host.ip);
    // if ip adress is 127.0.0.1 or localhost, it's the client running on the server so we get the server ip from user preferences
    if (ipAddress === '127.0.0.1' || ipAddress === '172.18.0.1' || ipAddress === 'localhost') {
      await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
        ipAddress = result.value;
      });
      console.log('Client Info Component: Using server IP address for Camilla DSP URL:', ipAddress);
    }
    return `ws://${ipAddress}:1234`;
  }

  async getUrl(): Promise<string> {
    if (!this.client) {
      console.error('Client Info Component: No client available to get Camilla DSP URL');
      return '';
    }
    var ipAddress = this.cleanIpAddress(this.client.host.ip);
    // if ip adress is 127.0.0.1 or localhost, it's the client running on the server so we get the server ip from user preferences
    if (ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
      await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
        ipAddress = result.value;
      });
      console.log('Client Info Component: Using server IP address for Camilla DSP URL:', ipAddress);
    }
    return ipAddress;
  }


  cleanIpAddress(ip: string): string {
    return ip.replace('::ffff:', '');
  }

  async getHardwareInfo() {
    if (!this.client) {
      console.error('Client Info Component: No client available to get hardware info');
      return;
    }
    const localHostName = await this.getUrl();

    this.hardwareStatus$ = this.beatnikHardwareService.getStatus(localHostName);
    this.hardwareStatus$.subscribe({
      next: (status) => {
        console.log(`Client Info Component: Hardware status for client ${this.client?.id}:`, status);
      },
      error: (err) => {
        console.error(`Client Info Component: Failed to get hardware status for client ${this.client?.id}`, err);
      }
    });
  }


  async openSoundcardPicker() {
    console.log('Open Soundcard Picker for client:', this.client?.id);
    // Here you would typically open a modal to select soundcards
    const hardwareStatus = await firstValueFrom(this.hardwareStatus$);
    const modal = await this.modalController.create({
      component: SoundcardPickerComponent,
      id: 'soundcard-picker-modal',
      componentProps: {
        clientId: this.client?.id,
        selectedHatId: hardwareStatus.currentConfig.id || ''
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.selectedHatId) {
      if (hardwareStatus.currentConfig.id === data.selectedHatId) {
        console.log('Client Info Component: Selected hat is the same as current configuration, no changes needed');
        return;
      } else {
        console.log('Client Info Component: Soundcard selected:', data.selectedHatId);
        this.showSoundCardWarning(data.selectedHatId);
      }
    } else {
      console.log('Client Info Component: Soundcard selection cancelled or no selection made');
    }
  }


  async showSoundCardWarning(hatId: string) {
    const alert = await this.alertController.create({
      header: 'Applying Soundcard Configuration',
      message: 'You have selected a new soundcard, your Beatnik Pi may need to restart to apply the changes .',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Client Info Component: Soundcard change cancelled by user');
          }
        },
        {
          text: 'Apply Now',
          handler: () => {
            console.log('Client Info Component: User chose to apply soundcard changes');
            this.applySoundcardConfig(hatId);
          }
        }
      ]
    });
    await alert.present();
  }


  async applySoundcardConfig(hatId: string) {
    if (!this.client) {
      console.error('Client Info Component: No client available to apply hardware configuration');
      return;
    }
    console.log(`Client Info Component: Applying hardware configuration ${hatId} to client ${this.client.id}`);
    const localHostName = await this.getUrl();
    this.beatnikHardwareService.applyConfiguration(hatId, localHostName).subscribe({
      next: (response) => {
        console.log(`Client Info Component: Successfully applied hardware configuration ${hatId} to client ${this.client?.id}`, response);
        this.showRebootInfo();
        if (response.rebootRequired) {
          console.log('Client Info Component: Reboot required. Triggering reboot...');
          this.beatnikHardwareService.reboot(localHostName).subscribe({
            next: () => {
              console.log(`Client Info Component: Successfully triggered reboot for client ${this.client?.id}`);
            },
            error: (err) => {
              console.error(`Client Info Component: Failed to trigger reboot for client ${this.client?.id}`, err);
            }
          });
        }
      },
      error: (err) => {
        console.error(`Client Info Component: Failed to apply hardware configuration ${hatId} to client ${this.client?.id}`, err);
      }
    });
  }

  async showRebootInfo() {
    // display alert to user that a reboot is required to apply changes, no options, just an OK button to dismiss
    const alert = await this.alertController.create({
      header: 'Rebooting now',
      message: 'Your Beatnik Pi is rebooting now to apply the new soundcard configuration. Please wait a moment and then refresh this page to see the updated hardware status.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            console.log('Client Info Component: User acknowledged reboot requirement');
          }
        }
      ]
    });
    await alert.present();
  }

  async disableSnapcastServer() {
    if (!this.client) {
      console.error('Client Info Component: No client available to disable Snapcast server');
      return;
    }
    const localHostName = this.client.host.name + '.local';
    try {
      const response = await firstValueFrom(this.beatnikSnapcastService.disable(localHostName));
      console.log(`Client Info Component: Disabled Snapcast server for client ${this.client.id}:`, response);
      this.snapcastServerStatus = response;
    } catch (error) {
      console.error(`Client Info Component: Failed to disable Snapcast server for client ${this.client.id}`, error);
    }
  }

  async enableSnapcastServer() {
    if (!this.client) {
      console.error('Client Info Component: No client available to enable Snapcast server');
      return;
    }
    const localHostName = this.client.host.name + '.local';
    try {
      const response = await firstValueFrom(this.beatnikSnapcastService.enable(localHostName));
      console.log(`Client Info Component: Enabled Snapcast server for client ${this.client.id}:`, response);
      this.snapcastServerStatus = response;
    } catch (error) {
      console.error(`Client Info Component: Failed to enable Snapcast server for client ${this.client.id}`, error);
    }
  }

   async refreshSnapcastStatus() {
    if (!this.client) {
      console.error('Client Info Component: No client available to refresh Snapcast status');
      return;
    }
    const localHostName = this.client.host.name + '.local';
    try {
      const status = await firstValueFrom(this.beatnikSnapcastService.getStatus(localHostName));
      console.log(`Client Info Component: Snapcast status for client ${this.client.id}:`, status);
      this.snapcastServerStatus = { ...status, success: true, message: 'Status retrieved successfully' };
    } catch (error) {
      console.error(`Client Info Component: Failed to get Snapcast status for client ${this.client.id}`, error);
    }
  }



}
