import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AlertController, ModalController } from '@ionic/angular';
import { firstValueFrom, Observable } from 'rxjs';
import { ChooseSpeakersComponent } from 'src/app/components/choose-speakers/choose-speakers.component';
import { SoundcardPickerComponent } from 'src/app/components/soundcard-picker/soundcard-picker.component';
import { SUPPORTED_HATS } from 'src/app/constant/hat.constant';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { Client, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';
import { BeatnikSnapcastService, SnapcastActionResponse } from 'src/app/services/beatnik-snapcast.service';
import { CamillaDspService } from 'src/app/services/camilla-dsp.service';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.page.html',
  styleUrls: ['./client-details.page.scss'],
  standalone: false
})
export class ClientDetailsPage implements OnInit, OnDestroy {


  id?: string;

  serverState?: Observable<SnapCastServerStatusResponse>;
  client?: Client;
  segment: 'details' | 'soundcard' | 'camilla-dsp' | 'settings' = 'camilla-dsp';

  hardwareStatus$: Observable<HardwareStatus>;

  hats = Object.values(SUPPORTED_HATS);

  manualHatId: string = '';

  camillaDspUrl: string;

  snapcastServerStatus?: SnapcastActionResponse;



  constructor(
    private avtivateRoute: ActivatedRoute,
    private snapcastService: SnapcastService,
    private modalController: ModalController,
    private beatnikHardwareService: BeatnikHardwareService,
    private beatnikSnapcastService: BeatnikSnapcastService,
    private camillaService: CamillaDspService,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    this.serverState = this.snapcastService.state$;
    this.id = this.avtivateRoute.snapshot.paramMap.get('id') || undefined;
    if (!this.id) {
      console.error('ClientDetailsPage: No ID found in route parameters');
      return;
    }
    console.log('ClientDetailsPage: ID from route parameters:', this.id);
    this.subscribeToClient();
  }

  subscribeToClient() {
    if (!this.id) {
      console.error('ClientDetailsPage: No ID available to subscribe to client');
      return;
    }
    this.serverState.subscribe(async (state) => {
      if (!state || !state.server) {
        console.warn('ClientDetailsPage: Invalid server state received', state);
        return;
      }
      this.client = state.server.groups.flatMap(group => group.clients).find(client => client.id === this.id);
      if (!this.client) {
        console.error(`ClientDetailsPage: Client with ID ${this.id} not found in server state`);
      } else {
        console.log('ClientDetailsPage: Found client:', this.client);
        this.camillaDspUrl = await this.getCamillaDspUrl();
        this.getHardwareInfo();
      }
    });
  }

  setClientName() {
    if (!this.client || !this.client.id) {
      console.error('ClientDetailsPage: No client or client ID available to set name');
      return;
    }
    this.snapcastService.setClientName(this.client.id, this.client.config.name).subscribe({
      next: () => {
        console.log(`ClientDetailsPage: Successfully set name for client ${this.client.id} to ${name}`);
      },
      error: (err) => {
        console.error(`ClientDetailsPage: Failed to set name for client ${this.client.id}`, err);
      }
    });
  }


  setClientLatency() {
    if (!this.client || !this.client.id) {
      console.error('ClientDetailsPage: No client or client ID available to set latency');
      return;
    }
    this.snapcastService.setClientLatency(this.client.id, this.client.config.latency).subscribe({
      next: () => {
        console.log(`ClientDetailsPage: Successfully set latency for client ${this.client.id} to ${this.client.config.latency}`);
      },
      error: (err) => {
        console.error(`ClientDetailsPage: Failed to set latency for client ${this.client.id}`, err);
      }
    });
  }

  setClientVolume() {
    if (!this.client || !this.client.id) {
      console.error('ClientDetailsPage: No client or client ID available to set volume');
      return;
    }
    this.snapcastService.setClientVolumePercent(this.client.id, this.client.config.volume.percent).subscribe({
      next: () => {
        console.log(`ClientDetailsPage: Successfully set volume for client ${this.client.id} to ${this.client.config.volume.percent}`);
      },
      error: (err) => {
        console.error(`ClientDetailsPage: Failed to set volume for client ${this.client.id}`, err);
      }
    });
  }

  refreshClient() {
    if (!this.id) {
      console.error('ClientDetailsPage: No ID available to refresh client');
      return;
    }
    this.snapcastService.getClientStatus(this.id).subscribe({
      next: () => {
        console.log(`ClientDetailsPage: Successfully refreshed client ${this.id}`);
        this.snapcastService.refreshState(); // Refresh the server state to get the latest data
      },
      error: (err) => {
        console.error(`ClientDetailsPage: Failed to refresh client ${this.id}`, err);
      }
    });
  }

  chooseSpeakers() {
    console.log('Choose speakers for client:', this.client?.id);
    // Here you would typically open a modal to select speakers
    this.modalController.create({
      component: ChooseSpeakersComponent,
      id: 'choose-speakers-modal',
      componentProps: { clientId: this.client?.id }
    }).then(modal => {
      modal.present();
    }).catch(err => {
      console.error('Error opening speaker selection modal:', err);
    });
  }

  cleanIpAddress(ip: string): string {
    return ip.replace('::ffff:', '');
  }

  async getHardwareInfo() {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to get hardware info');
      return;
    }
    const localHostName = await this.getUrl();

    this.hardwareStatus$ = this.beatnikHardwareService.getStatus(localHostName);
    this.hardwareStatus$.subscribe({
      next: (status) => {
        console.log(`ClientDetailsPage: Hardware status for client ${this.client?.id}:`, status);
      },
      error: (err) => {
        console.error(`ClientDetailsPage: Failed to get hardware status for client ${this.client?.id}`, err);
      }
    });
  }

  async applySoundcardConfig(hatId: string) {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to apply hardware configuration');
      return;
    }
    console.log(`ClientDetailsPage: Applying hardware configuration ${hatId} to client ${this.client.id}`);
    const localHostName = await this.getUrl();
    this.beatnikHardwareService.applyConfiguration(hatId, localHostName).subscribe({
      next: (response) => {
        console.log(`ClientDetailsPage: Successfully applied hardware configuration ${hatId} to client ${this.client?.id}`, response);
        this.showRebootInfo();
        if (response.rebootRequired) {
          console.log('ClientDetailsPage: Reboot required. Triggering reboot...');
          this.beatnikHardwareService.reboot(localHostName).subscribe({
            next: () => {
              console.log(`ClientDetailsPage: Successfully triggered reboot for client ${this.client?.id}`);
            },
            error: (err) => {
              console.error(`ClientDetailsPage: Failed to trigger reboot for client ${this.client?.id}`, err);
            }
          });
        }
      },
      error: (err) => {
        console.error(`ClientDetailsPage: Failed to apply hardware configuration ${hatId} to client ${this.client?.id}`, err);
      }
    });
  }


  async getCamillaDspUrl(): Promise<string> {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to get Camilla DSP URL');
      return '';
    }
    var ipAddress = this.cleanIpAddress(this.client.host.ip);
    // if ip adress is 127.0.0.1 or localhost, it's the client running on the server so we get the server ip from user preferences
    if (ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
      await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
        ipAddress = result.value;
      });
      console.log('ClientDetailsPage: Using server IP address for Camilla DSP URL:', ipAddress);
    }
    return `ws://${ipAddress}:1234`;
  }

  async getUrl(): Promise<string> {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to get Camilla DSP URL');
      return '';
    }
    var ipAddress = this.cleanIpAddress(this.client.host.ip);
    // if ip adress is 127.0.0.1 or localhost, it's the client running on the server so we get the server ip from user preferences
    if (ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
      await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
        ipAddress = result.value;
      });
      console.log('ClientDetailsPage: Using server IP address for Camilla DSP URL:', ipAddress);
    }
    return ipAddress;
  }

  async refreshSnapcastStatus() {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to refresh Snapcast status');
      return;
    }
    const localHostName = this.client.host.name + '.local';
    try {
      const status = await firstValueFrom(this.beatnikSnapcastService.getStatus(localHostName));
      console.log(`ClientDetailsPage: Snapcast status for client ${this.client.id}:`, status);
      this.snapcastServerStatus = { ...status, success: true, message: 'Status retrieved successfully' };
    } catch (error) {
      console.error(`ClientDetailsPage: Failed to get Snapcast status for client ${this.client.id}`, error);
    }
  }

  async disableSnapcastServer() {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to disable Snapcast server');
      return;
    }
    const localHostName = this.client.host.name + '.local';
    try {
      const response = await firstValueFrom(this.beatnikSnapcastService.disable(localHostName));
      console.log(`ClientDetailsPage: Disabled Snapcast server for client ${this.client.id}:`, response);
      this.snapcastServerStatus = response;
    } catch (error) {
      console.error(`ClientDetailsPage: Failed to disable Snapcast server for client ${this.client.id}`, error);
    }
  }

  async enableSnapcastServer() {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to enable Snapcast server');
      return;
    }
    const localHostName = this.client.host.name + '.local';
    try {
      const response = await firstValueFrom(this.beatnikSnapcastService.enable(localHostName));
      console.log(`ClientDetailsPage: Enabled Snapcast server for client ${this.client.id}:`, response);
      this.snapcastServerStatus = response;
    } catch (error) {
      console.error(`ClientDetailsPage: Failed to enable Snapcast server for client ${this.client.id}`, error);
    }
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
        console.log('ClientDetailsPage: Selected hat is the same as current configuration, no changes needed');
        return;
      } else {
        console.log('ClientDetailsPage: Soundcard selected:', data.selectedHatId);
        this.showSoundCardWarning(data.selectedHatId);
      }
    } else {
      console.log('ClientDetailsPage: Soundcard selection cancelled or no selection made');
    }
  }

  ngOnDestroy(): void {
  }

  ionViewWillLEave() {
    console.log('ClientDetailsPage: Leaving page, cleaning up resources if needed');
    this.camillaService.disconnect();
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
            console.log('ClientDetailsPage: Soundcard change cancelled by user');
          }
        },
        {
          text: 'Apply Now',
          handler: () => {
            console.log('ClientDetailsPage: User chose to apply soundcard changes');
            this.applySoundcardConfig(hatId);
          }
        }
      ]
    });
    await alert.present();
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
            console.log('ClientDetailsPage: User acknowledged reboot requirement');
          }
        }
      ]
    });
    await alert.present();
  }
} 