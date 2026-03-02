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
export class ClientDetailsPage implements OnInit {


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
      }
    });
  }

}