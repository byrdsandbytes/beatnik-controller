import { Component, DestroyRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Preferences } from '@capacitor/preferences';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Observable, firstValueFrom } from 'rxjs';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { Client } from 'src/app/model/snapcast.model';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';
import { BeatnikSnapcastService, SnapcastActionResponse } from 'src/app/services/beatnik-snapcast.service';
import { ChooseSpeakersComponent } from '../choose-speakers/choose-speakers.component';
import { SoundcardPickerComponent } from '../soundcard-picker/soundcard-picker.component';

type Segment = 'details' | 'soundcard' | 'camilla-dsp' | 'settings' | 'update';
type Action = 'refreshSnapcast' | 'enableSnapcast' | 'disableSnapcast' | 'restartSnapcast' | 'restartSnapcastClient' | 'reboot';
type ToastColor = 'success' | 'danger' | 'warning' | 'primary';

interface LoadState<T> {
  data?: T;
  loading: boolean;
  error: string;
}

const LOCAL_ADDRESSES = ['127.0.0.1', '172.18.0.1', 'localhost'];
const CAMILLA_DSP_PORT = 1234;

/**
 * Embedded (non-routed) component: Ionic's ionView* hooks are only fired for routed pages,
 * so the lifecycle is driven by Angular hooks. Requests are cancelled on destroy and results of
 * outdated requests (device changed meanwhile) are discarded.
 */
@Component({
  selector: 'app-client-info',
  templateUrl: './client-info.component.html',
  styleUrls: ['./client-info.component.scss'],
  standalone: false
})
export class ClientInfoComponent implements OnChanges {
  // Optional Snapcast view of the device (only available when it is known to the Snapcast server)
  @Input() client?: Client;
  // IP or hostname of the device; enough on its own to use everything except the Snapcast-only parts
  @Input() host?: string;

  segment: Segment = 'camilla-dsp';
  deviceHost = '';
  camillaDspUrl = '';

  hardware: LoadState<HardwareStatus> = { loading: false, error: '' };
  snapcast: LoadState<SnapcastActionResponse> = { loading: false, error: '' };
  soundcardImageLoaded = false;
  isLoading: Partial<Record<Action, boolean>> = {};

  private destroyed = false;
  private resolveCount = 0;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private modalController: ModalController,
    private beatnikHardwareService: BeatnikHardwareService,
    private beatnikSnapcastService: BeatnikSnapcastService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.destroyRef.onDestroy(() => this.destroyed = true);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['host'] || changes['client']) {
      await this.updateDevice();
    }
  }

  onSegmentChange(event: CustomEvent) {
    this.segment = event.detail.value as Segment;
    this.loadSegmentData();
  }

  // Resolves the device address and resets everything that depends on it, but only when it actually changed
  private async updateDevice() {
    const resolveId = ++this.resolveCount;
    const host = await this.resolveHost();
    if (this.destroyed || resolveId !== this.resolveCount || host === this.deviceHost) {
      return;
    }
    this.deviceHost = host;
    this.camillaDspUrl = host ? `ws://${host}:${CAMILLA_DSP_PORT}` : '';
    this.hardware = { loading: false, error: '' };
    this.soundcardImageLoaded = false;
    this.snapcast = { loading: false, error: '' };
    this.loadSegmentData();
  }

  // Data is fetched lazily, only for the visible tab and only if it isn't loaded yet
  private loadSegmentData() {
    if (!this.deviceHost) {
      return;
    }
    if (this.segment === 'soundcard' && !this.hardware.data && !this.hardware.error && !this.hardware.loading) {
      this.loadHardware();
    } else if (this.segment === 'settings' && !this.snapcast.data && !this.snapcast.loading) {
      this.refreshSnapcastStatus(true);
    }
  }

  // Explicit host first, otherwise the Snapcast client's IP
  private async resolveHost(): Promise<string> {
    let address = this.host?.trim() || (this.client ? this.client.host.ip.replace('::ffff:', '') : '');
    // The client running on the server itself reports a local address, so use the configured server instead
    if (LOCAL_ADDRESSES.includes(address)) {
      const result = await Preferences.get({ key: UserPreference.SERVER_URL });
      address = result.value ?? '';
    }
    return address;
  }

  private isStale(host: string): boolean {
    return this.destroyed || host !== this.deviceHost;
  }

  private request<T>(request$: Observable<T>): Promise<T> {
    return firstValueFrom(request$.pipe(takeUntilDestroyed(this.destroyRef)));
  }

  // Runs a device action while exposing its busy state to the template
  private async runAction<T>(action: Action, request$: Observable<T>): Promise<T | undefined> {
    this.isLoading[action] = true;
    try {
      return await this.request(request$);
    } finally {
      this.isLoading[action] = false;
    }
  }

  // ---- Soundcard ----

  async loadHardware() {
    const host = this.deviceHost;
    if (!host) {
      return;
    }
    this.soundcardImageLoaded = false;
    this.hardware = { ...this.hardware, loading: true, error: '' };
    try {
      const data = await this.request(this.beatnikHardwareService.getStatus(host));
      if (!this.isStale(host)) {
        this.hardware = { data, loading: false, error: '' };
      }
    } catch (err) {
      if (!this.isStale(host)) {
        console.error(`Client Info Component: Failed to get hardware status for ${host}`, err);
        this.hardware = { loading: false, error: this.describeHttpError(err, host) };
      }
    }
  }

  async openSoundcardPicker() {
    const currentId = this.hardware.data?.currentConfig?.id ?? '';
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
    if (data?.selectedHatId && data.selectedHatId !== currentId) {
      await this.confirmSoundcardChange(data.selectedHatId);
    }
  }

  private async confirmSoundcardChange(hatId: string) {
    const alert = await this.alertController.create({
      header: 'Applying Soundcard Configuration',
      message: 'You have selected a new soundcard, your Beatnik Pi may need to restart to apply the changes.',
      buttons: [
        { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
        { text: 'Apply Now', handler: () => { this.applySoundcardConfig(hatId); } }
      ]
    });
    await alert.present();
  }

  private async applySoundcardConfig(hatId: string) {
    const host = this.deviceHost;
    if (!host) {
      return;
    }
    try {
      const response = await this.request(this.beatnikHardwareService.applyConfiguration(hatId, host));
      if (response.rebootRequired) {
        await this.showRebootInfo();
        await this.triggerReboot(host, 'Configuration applied, but the reboot could not be triggered. Please reboot the device manually.', 'warning');
      }
    } catch (err) {
      if (!this.destroyed) {
        console.error(`Client Info Component: Failed to apply hardware configuration ${hatId} to ${host}`, err);
        this.presentToast(`Could not apply the soundcard configuration. ${this.describeHttpError(err, host)}`, 'danger');
      }
    }
  }

  private async showRebootInfo() {
    const alert = await this.alertController.create({
      header: 'Rebooting now',
      message: 'Your Beatnik Pi is rebooting now to apply the new soundcard configuration. Please wait a moment and then refresh this page to see the updated hardware status.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // ---- Snapcast ----

  async refreshSnapcastStatus(silent = false) {
    const host = this.deviceHost;
    if (!host) {
      return;
    }
    this.snapcast = { ...this.snapcast, loading: true, error: '' };
    this.isLoading.refreshSnapcast = true;
    try {
      const status = await this.request(this.beatnikSnapcastService.getStatus(host));
      if (!this.isStale(host)) {
        this.snapcast = { data: { ...status, success: true, message: 'Status retrieved successfully' }, loading: false, error: '' };
      }
    } catch (err) {
      if (!this.isStale(host)) {
        console.error(`Client Info Component: Failed to get Snapcast status for ${host}`, err);
        this.snapcast = { ...this.snapcast, loading: false, error: this.describeHttpError(err, host) };
        if (!silent) {
          this.presentToast('Failed to Refresh Snapcast Status', 'danger');
        }
      }
    } finally {
      this.isLoading.refreshSnapcast = false;
    }
  }

  enableSnapcastServer() {
    return this.setSnapcastServer('enableSnapcast', 'Snapcast Server Enabled', 'Failed to Enable Snapcast');
  }

  disableSnapcastServer() {
    return this.setSnapcastServer('disableSnapcast', 'Snapcast Server Disabled', 'Failed to Disable Snapcast');
  }

  private async setSnapcastServer(action: 'enableSnapcast' | 'disableSnapcast', successMessage: string, failureMessage: string) {
    const host = this.deviceHost;
    if (!host) {
      return;
    }
    const request$ = action === 'enableSnapcast'
      ? this.beatnikSnapcastService.enable(host)
      : this.beatnikSnapcastService.disable(host);
    try {
      const response = await this.runAction(action, request$);
      if (!this.isStale(host) && response) {
        this.snapcast = { data: response, loading: false, error: '' };
        this.presentToast(successMessage, 'success');
      }
    } catch (err) {
      this.handleActionError(err, failureMessage);
    }
  }

  restartSnapcastServer() {
    return this.restartService('restartSnapcast', 'Snapcast Server Restarted', 'Failed to Restart Snapcast Server');
  }

  restartSnapcastClient() {
    return this.restartService('restartSnapcastClient', 'Snapcast Client Restarted', 'Failed to Restart Snapcast Client');
  }

  private async restartService(action: 'restartSnapcast' | 'restartSnapcastClient', successMessage: string, failureMessage: string) {
    const host = this.deviceHost;
    if (!host) {
      return;
    }
    const request$ = action === 'restartSnapcast'
      ? this.beatnikSnapcastService.restartServer(host)
      : this.beatnikSnapcastService.restartClient(host);
    try {
      await this.runAction(action, request$);
      if (!this.isStale(host)) {
        this.presentToast(successMessage, 'success');
        this.refreshSnapcastStatus(true);
      }
    } catch (err) {
      this.handleActionError(err, failureMessage);
    }
  }

  // ---- Device ----

  rebootDevice() {
    return this.triggerReboot(this.deviceHost, 'Failed to Reboot Device', 'danger');
  }

  private async triggerReboot(host: string, failureMessage: string, failureColor: ToastColor) {
    if (!host) {
      return;
    }
    try {
      await this.runAction('reboot', this.beatnikHardwareService.reboot(host));
      if (!this.destroyed) {
        this.presentToast('Device Reboot Initiated', 'success');
      }
    } catch (err) {
      if (!this.destroyed) {
        console.error(`Client Info Component: Failed to trigger reboot for ${host}`, err);
        this.presentToast(failureMessage, failureColor);
      }
    }
  }

  async chooseSpeakers() {
    const modal = await this.modalController.create({
      component: ChooseSpeakersComponent,
      id: 'choose-speakers-modal',
      componentProps: {
        clientId: this.client?.id
      }
    });
    await modal.present();
  }

  // ---- Helpers ----

  private handleActionError(err: unknown, message: string) {
    if (!this.destroyed) {
      console.error(`Client Info Component: ${message}`, err);
      this.presentToast(message, 'danger');
    }
  }

  private describeHttpError(err: any, host: string): string {
    if (err?.status === 0 || err?.name === 'TimeoutError') {
      return `Can't reach the Beatnik device at ${host}. Check that it is powered on, on the same network, and that the Beatnik API is running.`;
    }
    const detail = err?.error?.error ?? err?.error?.message;
    return `The device answered with an error (${err?.status ?? 'unknown'})${detail ? `: ${detail}` : '.'}`;
  }

  private async presentToast(message: string, color: ToastColor = 'success') {
    const toast = await this.toastController.create({ message, duration: 2000, color, position: 'bottom' });
    await toast.present();
  }
}
