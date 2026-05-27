import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subscription, EMPTY, firstValueFrom } from 'rxjs';
import { catchError, first, tap } from 'rxjs/operators';
import { SnapcastService } from 'src/app/services/snapcast.service'; // Adjust path
import { Group, Client, Stream, ServerDetail, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model'; // Adjust path
import { BeatnikHardwareService } from 'src/app/services/beatnik-hardware.service';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { Preferences } from '@capacitor/preferences';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-snapcast-status',
  templateUrl: './snapcast-status.component.html',
  styleUrls: ['./snapcast-status.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // If using standalone components, set to true
})
export class SnapcastStatusComponent implements OnInit, OnDestroy {

  displayState?: Observable<SnapCastServerStatusResponse | null>;
  isLoading: { [key: string]: boolean } = {};
  serverUrl: string = '';

  private subscriptions = new Subscription();

  constructor(
    public snapcastService: SnapcastService,
    private beatnikHardwareService: BeatnikHardwareService,
    private toastController: ToastController,
    private alertController: AlertController) {

  }

  ngOnInit() {
    this.displayState = this.snapcastService.state$

  }

  getClientStats(state: SnapCastServerStatusResponse): { total: number, online: number, offline: number } {
    if (!state?.server?.groups) return { total: 0, online: 0, offline: 0 };

    let total = 0;
    let online = 0;

    state.server.groups.forEach(group => {
      group.clients?.forEach(client => {
        total++;
        if (client.connected) online++;
      });
    });

    return { total, online, offline: total - online };
  }



  onSetClientVolumePercent(clientId: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement) return;
    const volume = +inputElement.value;

    this.subscriptions.add(
      this.snapcastService.setClientVolumePercent(clientId, volume).pipe(
        catchError(err => {
          console.error(`Component: Failed to set volume for ${clientId}`, err);
          return EMPTY;
        })
      ).subscribe()
    );
  }

  // Clean offline clients and empty groups if needed. Maybe not the best place to do this, but it works for now.
  async cleanOfflineClients(): Promise<void> {
    const state = await firstValueFrom(this.displayState!);
    if (!state) return;

    const offlineClientIds: string[] = [];

    state.server.groups.forEach(group => {
      group.clients?.forEach(client => {
        if (!client.connected) {
          offlineClientIds.push(client.id);
        }
      });
    });

    for (const clientId of offlineClientIds) {
      try {
        await this.snapcastService.deleteServerClient(clientId);
        console.log(`Deleted offline client ${clientId}`);
      } catch (err) {
        console.error(`Failed to delete offline client ${clientId}`, err);
      }
    }
  }

  async rebootServerAndClients(): Promise<void> {
    await this.rebootServer();
    // wait 5 seconds before rebooting clients to give the server time to come back online
    await new Promise(resolve => setTimeout(resolve, 5000));
    await this.rebootClients();
  }

  // async formatIpAddress(ip: string): Promise<string> {
  //   // Rebooted client ::ffff:192.168.1.114
  //   if (ip.startsWith("::ffff:")) {
  //     return ip.substring(7);
  //   }
  //   return ip;
  // }

  async rebootDevice(ip: string): Promise<void> {

    this.isLoading['reboot'] = true;
    this.beatnikHardwareService.reboot(ip).subscribe({
      next: () => {
        console.log(`Client Info Component: Successfully triggered reboot for client ${ip}`);
        this.isLoading['reboot'] = false;
        // this.presentToast('Device Reboot Initiated', 'success');
      },
      error: (err) => {
        console.error(`Client Info Component: Failed to trigger reboot for client ${ip}`, err);
        this.isLoading['reboot'] = false;
        this.presentToast('Failed to Reboot Device', 'danger');
      }
    });
  }

  presentToast(message: string, color: 'success' | 'danger'): void {
    // Implement toast notification logic here, e.g., using Ionic's ToastController
    console.log(`Toast: ${message} (color: ${color})`);
    this.toastController.create({
      message,
      color,
      duration: 2000
    }).then(toast => toast.present());
  }

  async getUrl(ip: string): Promise<string> {

    var ipAddress = this.cleanIpAddress(ip);
    console.log('Original IP address:', ip);
    // if ip adress is 127.0.0.1 or localhost, it's the client running on the server so we get the server ip from user preferences
    if (ipAddress === '127.0.0.1' || ipAddress === 'localhost') {
      await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
        ipAddress = result.value;
      });
    }
    return ipAddress;
  }

  async rebootServer(): Promise<void> {
    const state = await firstValueFrom(this.displayState!);
    if (!state) return;

    // const serverIp = await this.formatIpAddress(state.server.server.host.ip);

    // get server ip from user preferences and reboot using hardware service
    const serverIp = await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
      return result.value;
    });


    console.log(`Rebooting server and ${serverIp}...`);
    try {
      await this.rebootDevice(serverIp);
      console.log(`Rebooted server ${serverIp}`);
      this.presentToast('Reboot Initiated for Server', 'success');
    } catch (err) {
      console.error('Failed to reboot server and clients', err);
      this.presentToast('Failed to Reboot Server', 'danger');
    }
  }

  async rebootClients(): Promise<void> {
    const state = await firstValueFrom(this.displayState!);
    if (!state) return;

    const clientIps = state.server.groups.flatMap(group => group.clients?.map(client => client.host.ip) || []);
    for (const ip of clientIps) {
      const formattedIp = await this.getUrl(ip);


      try {
        // if ip adress is server ip from user preferences, skip rebooting since it will be handled in rebootServer
        const serverIp = await Preferences.get({ key: UserPreference.SERVER_URL }).then(result => result.value);
        if (formattedIp === serverIp) {
          console.log(`Skipping reboot for client ${formattedIp} since it matches the server IP`);
          continue;
        }

        await this.rebootDevice(formattedIp);
        console.log(`Rebooted client ${formattedIp}`);
      } catch (err) {
        console.error(`Failed to reboot client ${formattedIp}`, err);
      }
    }
    this.presentToast('Reboot Initiated for All Clients', 'success');
  }


  cleanIpAddress(ip: string): string {
    return ip.replace('::ffff:', '');
  }

  async showRebootServerAndClientsAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Reboot',
      message: 'Are you sure you want to reboot the server and all clients? This will cause temporary disruption of audio playback.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reboot',
          handler: () => {
            this.rebootServerAndClients();
          }
        }
      ]
    });

    await alert.present();
  }

  async showRebootClientsAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Reboot',
      message: 'Are you sure you want to reboot all clients? This will cause temporary disruption of audio playback on all clients.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reboot',
          handler: () => {
            this.rebootClients();
          }
        }
      ]
    });

    await alert.present();
  }

  showRebootServerAlert(): void {
    this.alertController.create({
      header: 'Confirm Reboot',
      message: 'Are you sure you want to reboot the server? This will cause temporary disruption of audio playback.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reboot',
          handler: () => {
            this.rebootServer();
          }
        }
      ]
    }).then(alert => alert.present());
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}