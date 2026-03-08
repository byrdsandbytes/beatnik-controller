import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { firstValueFrom, Observable } from 'rxjs';
import { SoundcardPickerComponent } from 'src/app/components/soundcard-picker/soundcard-picker.component';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';

@Component({
  selector: 'app-setup-soundcard',
  templateUrl: './setup-soundcard.page.html',
  styleUrls: ['./setup-soundcard.page.scss'],
  standalone: false
})
export class SetupSoundcardPage implements OnInit {

  hardwareStatus$: Observable<HardwareStatus>;
  ip: string;
  state: 'loading' | 'error' | 'rebooting' = 'loading';

  constructor(
    private beatnikHardwareService: BeatnikHardwareService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modalController: ModalController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    this.ip = this.activatedRoute.snapshot.paramMap.get('id');
    if (!this.ip) {
      console.error('No IP address provided in route parameters');
      // Optionally, navigate back or show an error message
      return;
    }
    this.hardwareStatus$ = this.beatnikHardwareService.getStatus(this.ip);
  }

  async openSoundcardPicker() {
    // console.log('Open Soundcard Picker for client:', this.client?.id);
    // Here you would typically open a modal to select soundcards
    const hardwareStatus = await firstValueFrom(this.hardwareStatus$);
    const modal = await this.modalController.create({
      component: SoundcardPickerComponent,
      id: 'soundcard-picker-modal',
      componentProps: {
        selectedHatId: hardwareStatus.currentConfig.id || ''
      }
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.selectedHatId) {
      if (hardwareStatus.currentConfig.id === data.selectedHatId) {
        console.log('SetupSoundcardPage: Selected hat is the same as current configuration, no changes needed');
        return;
      } else {
        console.log('SetupSoundcardPage: Soundcard selected:', data.selectedHatId);
        this.showSoundCardWarning(data.selectedHatId);
      }
    } else {
      console.log('SetupSoundcardPage: Soundcard selection cancelled or no selection made');
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
            console.log('SetupSoundcardPage: Soundcard change cancelled by user');
          }
        },
        {
          text: 'Apply Now',
          handler: () => {
            console.log('SetupSoundcardPage: User chose to apply soundcard changes');
            this.applySoundcardConfig(hatId);
          }
        }
      ]
    });
    await alert.present();
  }

  async applySoundcardConfig(hatId: string) {

    console.log(`SetupSoundcardPage: Applying hardware configuration ${hatId} to client ${this.ip}`);
    const localHostName = this.ip;
    this.beatnikHardwareService.applyConfiguration(hatId, localHostName).subscribe({
      next: (response) => {
        console.log(`SetupSoundcardPage: Successfully applied hardware configuration ${hatId} to client ${this.ip}`, response);
        this.showRebootInfo();
        if (response.rebootRequired) {
          console.log('SetupSoundcardPage: Reboot required. Triggering reboot...');
          this.beatnikHardwareService.reboot(localHostName).subscribe({
            next: () => {
              console.log(`SetupSoundcardPage: Successfully triggered reboot for client ${this.ip}`);
            },
            error: (err) => {
              console.error(`SetupSoundcardPage: Failed to trigger reboot for client ${this.ip}`, err);
            }
          });
        }
      },
      error: (err) => {
        console.error(`SetupSoundcardPage: Failed to apply hardware configuration ${hatId} to client ${this.ip}`, err);
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
            console.log('ClientDetailsPage: User acknowledged reboot requirement');
            this.state = 'rebooting';
            this.hardwareStatus$ = null; // Clear hardware status while rebooting
            this.waitForReboot();
          }
        }
      ]
    });
    await alert.present();
  }

  waitForReboot() {
    console.log('SetupSoundcardPage: Waiting for client to reboot and come back online...');
    const checkInterval = 5000; // Check every 5 seconds
    const timeOut = 2 * 60 * 1000; // Timeout after 2 minutes
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      this.beatnikHardwareService.getStatus(this.ip).subscribe({
        next: (status) => {
          console.log('SetupSoundcardPage: Client is back online after reboot', status);
          clearInterval(intervalId);
          this.hardwareStatus$ = new Observable<HardwareStatus>(observer => observer.next(status));
          this.state = 'loading'; // Reset state to loading while we fetch the new hardware status
        },
        error: (err) => {
          console.log('SetupSoundcardPage: Client is still offline, waiting...', err);
          if (Date.now() - startTime > timeOut) {
            console.error('SetupSoundcardPage: Timeout waiting for client to reboot');
            clearInterval(intervalId);
            this.state = 'error';
          }
        }
      });
    }, checkInterval);

  }

  completeSetup() {
    console.log('SetupSoundcardPage: User completed soundcard setup, navigating back to client details');
    this.router.navigateByUrl('setup-device-group-name/' + this.ip);
  }

}
