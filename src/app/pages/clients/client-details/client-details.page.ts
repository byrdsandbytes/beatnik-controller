import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { ModalController } from '@ionic/angular';
import { firstValueFrom, Observable } from 'rxjs';
import { ChooseSpeakersComponent } from 'src/app/components/choose-speakers/choose-speakers.component';
import { HatEnum } from 'src/app/enum/hat.enum';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { Client, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.page.html',
  styleUrls: ['./client-details.page.scss'],
  standalone: false
})
export class ClientDetailsPage implements OnInit {


  id?: string;

  serverState?: Observable<SnapCastServerStatusResponse>;
  client?: Client;
  segment: 'details' | 'soundcard' | 'camilla-dsp' | 'settings' = 'camilla-dsp';

  hardwareStatus$: Observable<HardwareStatus>;

  hatEnum = HatEnum;

  manualHatId: string = '';

  camillaDspUrl: string;



  constructor(
    private avtivateRoute: ActivatedRoute,
    private snapcastService: SnapcastService,
    private modalController: ModalController,
    private beatnikHardwareService: BeatnikHardwareService
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

  getHardwareInfo() {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to get hardware info');
      return;
    }
    const localHostName = this.client.host.name + '.local';
    this.hardwareStatus$ = this.beatnikHardwareService.getStatus(localHostName);
  }

  applySoundcardConfig(hatId: string) {
    if (!this.client) {
      console.error('ClientDetailsPage: No client available to apply hardware configuration');
      return;
    }
    console.log(`ClientDetailsPage: Applying hardware configuration ${hatId} to client ${this.client.id}`);
    const localHostName = this.client.host.name + '.local';
    this.beatnikHardwareService.applyConfiguration(hatId, localHostName).subscribe({
      next: (response) => {
        console.log(`ClientDetailsPage: Successfully applied hardware configuration ${hatId} to client ${this.client?.id}`, response);
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



}
