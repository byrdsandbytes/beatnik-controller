import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom, Observable } from 'rxjs';
import { SUPPORTED_HATS } from 'src/app/constant/hat.constant';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { SnapCastServerStatusResponse, Client } from 'src/app/model/snapcast.model';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';
import { BeatnikSnapcastService, SnapcastActionResponse } from 'src/app/services/beatnik-snapcast.service';
import { BeatnikSystemService, SystemInfo } from 'src/app/services/beatnik-system.service';
import { CamillaDspService } from 'src/app/services/camilla-dsp.service';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { SoundcardPickerComponent } from '../soundcard-picker/soundcard-picker.component';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { ChooseSpeakersComponent } from '../choose-speakers/choose-speakers.component';

@Component({
  selector: 'app-client-info',
  templateUrl: './client-info.component.html',
  styleUrls: ['./client-info.component.scss'],
  standalone: false
})
export class ClientInfoComponent implements OnInit, OnChanges {
  // Optional Snapcast view of the device (only available when it is known to the Snapcast server)
  @Input() client?: Client;
  // IP or hostname of the device; enough on its own to use everything except the Snapcast-only parts
  @Input() host?: string;

  serverState?: Observable<SnapCastServerStatusResponse>;
  segment: 'details' | 'soundcard' | 'camilla-dsp' | 'settings' | 'update' = 'camilla-dsp';
  deviceHost = '';
  hardwareStatus?: HardwareStatus;
  hardwareLoading = false;
  hardwareError = '';
  systemInfo$?: Observable<SystemInfo>;
  hats = Object.values(SUPPORTED_HATS);
  camillaDspUrl: string = '';
  snapcastServerStatus?: SnapcastActionResponse;
  
  isLoading: { [key: string]: boolean } = {};


  constructor(
    private snapcastService: SnapcastService,
    private modalController: ModalController,
    private beatnikHardwareService: BeatnikHardwareService,
    private beatnikSnapcastService: BeatnikSnapcastService,
    private beatnikSystemService: BeatnikSystemService,
    private camillaService: CamillaDspService,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    this.serverState = this.snapcastService.state$;
    await this.loadDevice();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['host'] || changes['client']) {
      await this.loadDevice();
    }
  }

  // Reloads everything that depends on the device address, but only when that address actually changed
  private async loadDevice() {
    const host = await this.getUrl();
    if (!host) {
      this.deviceHost = '';
      this.camillaDspUrl = '';
      return;
    }
    if (host === this.deviceHost) {
      return;
    }
    this.deviceHost = host;
    this.camillaDspUrl = `ws://${host}:1234`;
    this.getHardwareInfo();
    this.getSystemInfo();
    this.refreshSnapcastStatus();
  }

  // Resolves the address of the device: explicit host first, otherwise the Snapcast client's IP
  async getUrl(): Promise<string> {
    let address = this.host?.trim() || (this.client ? this.cleanIpAddress(this.client.host.ip) : '');
    // The client running on the server itself reports a local address, so use the configured server instead
    if (address === '127.0.0.1' || address === '172.18.0.1' || address === 'localhost') {
      const result = await Preferences.get({ key: UserPreference.SERVER_URL });
      address = result.value ?? '';
    }
    return address;
  }


  cleanIpAddress(ip: string): string {
    return ip.replace('::ffff:', '');
  }

  async getHardwareInfo() {
    const localHostName = await this.getUrl();
    if (!localHostName) {
      return;
    }

    this.hardwareLoading = true;
    this.hardwareError = '';
    this.beatnikHardwareService.getStatus(localHostName).subscribe({
      next: (status) => {
        console.log(`Client Info Component: Hardware status for ${localHostName}:`, status);
        this.hardwareStatus = status;
        this.hardwareLoading = false;
      },
      error: (err) => {
        console.error(`Client Info Component: Failed to get hardware status for ${localHostName}`, err);
        this.hardwareStatus = undefined;
        this.hardwareLoading = false;
        this.hardwareError = this.describeHttpError(err, localHostName);
      }
    });
  }

  private describeHttpError(err: any, host: string): string {
    if (err?.status === 0 || err?.name === 'TimeoutError') {
      return `Can't reach the Beatnik device at ${host}. Check that it is powered on, on the same network, and that the Beatnik API is running.`;
    }
    const detail = err?.error?.error ?? err?.error?.message;
    return `The device answered with an error (${err?.status ?? 'unknown'})${detail ? `: ${detail}` : '.'}`;
  }


  async openSoundcardPicker() {
    console.log('Open Soundcard Picker for client:', this.client?.id);
    // Here you would typically open a modal to select soundcards
    const currentId = this.hardwareStatus?.currentConfig?.id ?? '';
    const modal = await this.modalController.create({
      component: SoundcardPickerComponent,
      id: 'soundcard-picker-modal',
      componentProps: {
        clientId: this.client?.id,
        selectedHatId: currentId
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.selectedHatId) {
      if (currentId === data.selectedHatId) {
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
    const localHostName = await this.getUrl();
    if (!localHostName) {
      return;
    }
    console.log(`Client Info Component: Applying hardware configuration ${hatId} to ${localHostName}`);
    this.beatnikHardwareService.applyConfiguration(hatId, localHostName).subscribe({
      next: (response) => {
        console.log(`Client Info Component: Successfully applied hardware configuration ${hatId} to client ${this.client?.id}`, response);
        this.showRebootInfo();
        if (response.rebootRequired) {
          console.log('Client Info Component: Reboot required. Triggering reboot...');
          this.beatnikHardwareService.reboot(localHostName).subscribe({
            next: () => {
              console.log(`Client Info Component: Successfully triggered reboot for ${localHostName}`);
            },
            error: (err) => {
              console.error(`Client Info Component: Failed to trigger reboot for ${localHostName}`, err);
              this.presentToast('Configuration applied, but the reboot could not be triggered. Please reboot the device manually.', 'warning');
            }
          });
        }
      },
      error: (err) => {
        console.error(`Client Info Component: Failed to apply hardware configuration ${hatId} to client ${this.client?.id}`, err);
        this.presentToast(`Could not apply the soundcard configuration. ${this.describeHttpError(err, localHostName)}`, 'danger');
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

  async presentToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }

  async disableSnapcastServer() {
    const localHostName = await this.getUrl();
    if (!localHostName) {
      return;
    }
    this.isLoading['disableSnapcast'] = true;
    try {
      const response = await firstValueFrom(this.beatnikSnapcastService.disable(localHostName));
      console.log(`Client Info Component: Disabled Snapcast server for ${localHostName}:`, response);
      this.snapcastServerStatus = response;
      this.presentToast('Snapcast Server Disabled', 'success');
    } catch (error) {
      console.error(`Client Info Component: Failed to disable Snapcast server for ${localHostName}`, error);
      this.presentToast('Failed to Disable Snapcast', 'danger');
    } finally {
      this.isLoading['disableSnapcast'] = false;
    }
  }

  async enableSnapcastServer() {
    const localHostName = await this.getUrl();
    if (!localHostName) {
      return;
    }
    this.isLoading['enableSnapcast'] = true;
    try {
      const response = await firstValueFrom(this.beatnikSnapcastService.enable(localHostName));
      console.log(`Client Info Component: Enabled Snapcast server for ${localHostName}:`, response);
      this.snapcastServerStatus = response;
      this.presentToast('Snapcast Server Enabled', 'success');
    } catch (error) {
      console.error(`Client Info Component: Failed to enable Snapcast server for ${localHostName}`, error);
      this.presentToast('Failed to Enable Snapcast', 'danger');
    } finally {
      this.isLoading['enableSnapcast'] = false;
    }
  }

  async refreshSnapcastStatus() {
    const localHostName = await this.getUrl();
    if (!localHostName) {
      return;
    }
    this.isLoading['refreshSnapcast'] = true;
    try {
      const status = await firstValueFrom(this.beatnikSnapcastService.getStatus(localHostName));
      console.log(`Client Info Component: Snapcast status for ${localHostName}:`, status);
      this.snapcastServerStatus = { ...status, success: true, message: 'Status retrieved successfully' };
      // this.presentToast('Snapcast Status Refreshed', 'success');
    } catch (error) {
      console.error(`Client Info Component: Failed to get Snapcast status for ${localHostName}`, error);
      this.presentToast('Failed to Refresh Snapcast Status', 'danger');
    } finally {
      this.isLoading['refreshSnapcast'] = false;
    }
  }

  async rebootDevice() {
    const localHostName = await this.getUrl();
    if (!localHostName) {
      return;
    }
    this.isLoading['reboot'] = true;
    this.beatnikHardwareService.reboot(localHostName).subscribe({
      next: () => {
        console.log(`Client Info Component: Successfully triggered reboot for ${localHostName}`);
        this.isLoading['reboot'] = false;
        this.presentToast('Device Reboot Initiated', 'success');
      },
      error: (err) => {
        console.error(`Client Info Component: Failed to trigger reboot for ${localHostName}`, err);
        this.isLoading['reboot'] = false;
        this.presentToast('Failed to Reboot Device', 'danger');
      }
    });
  }


  async chooseSpeakers() {
    console.log('Client Info Component: Opening speaker selection for client:', this.client?.id);
    const modal = await this.modalController.create({
      component: ChooseSpeakersComponent,
      id: 'choose-speakers-modal',
      componentProps: {
        clientId: this.client?.id
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.selectedId) {
      console.log('Client Info Component: Speaker selected:', data.selectedId);
    } else {
      console.log('Client Info Component: Speaker selection cancelled or no selection made');
    }
  }

  async getSystemInfo() {
    const localHostName = await this.getUrl();
    if (!localHostName) return;
    this.isLoading['systemInfo'] = true;
    this.systemInfo$ = this.beatnikSystemService.getInfo(localHostName);
    this.systemInfo$.subscribe({
      next: (info) => {
        console.log('System Info:', info);
        this.isLoading['systemInfo'] = false;
      },
      error: (err) => {
        console.error('Failed to get system info:', err);
        this.isLoading['systemInfo'] = false;
        this.presentToast('Failed to retrieve System Info', 'danger');
      }
    });
  }

  async restartSnapcastServer() {
    const localHostName = await this.getUrl();
    if (!localHostName) return;
    this.isLoading['restartSnapcast'] = true;
    this.beatnikSnapcastService.restartServer(localHostName).subscribe({
      next: (response) => {
        console.log('Successfully restarted Snapcast server:', response);
        this.presentToast('Snapcast Server Restarted', 'success');
        this.refreshSnapcastStatus();
        this.isLoading['restartSnapcast'] = false;
      },
      error: (err) => {
        console.error('Failed to restart Snapcast server:', err);
        this.presentToast('Failed to Restart Snapcast Server', 'danger');
        this.isLoading['restartSnapcast'] = false;
      }
    });
  }

  async restartSnapcastClient() {
    const localHostName = await this.getUrl();
    if (!localHostName) return;
    this.isLoading['restartSnapcastClient'] = true;
    this.beatnikSnapcastService.restartClient(localHostName).subscribe({
      next: (response) => {
        console.log('Successfully restarted Snapcast client:', response);
        this.presentToast('Snapcast Client Restarted', 'success');
        this.refreshSnapcastStatus();
        this.isLoading['restartSnapcastClient'] = false;
      },
      error: (err) => {
        console.error('Failed to restart Snapcast client:', err);
        this.presentToast('Failed to Restart Snapcast Client', 'danger');
        this.isLoading['restartSnapcastClient'] = false;
      }
    });
  }
}



