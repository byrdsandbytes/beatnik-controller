import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { Observable } from 'rxjs';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { SnapCastServerStatusResponse, Stream } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-stream-details',
  templateUrl: './stream-details.page.html',
  styleUrls: ['./stream-details.page.scss'],
  standalone: false
})
export class StreamDetailsPage implements OnInit {

  streamId?: string;
  serverState?: Observable<SnapCastServerStatusResponse>;
  stream?: Stream;

  streamCamillaDSPPort: number  = 1235;
  serverUrl: string = '';




  constructor(
    private activatedRoute: ActivatedRoute,
    private snapcastService: SnapcastService

  ) { }

  ngOnInit(
  ) {
    this.streamId = this.activatedRoute.snapshot.paramMap.get('id') || undefined;
    if (!this.streamId) {
      console.error('StreamDetailsPage: No ID found in route parameters');
      return;
    }
    console.log('StreamDetailsPage: ID from route parameters:', this.streamId);
    this.serverState = this.snapcastService.state$;
    this.subscribeToStream(this.streamId);
    this.getCamillaDspUrl();
  }

  subscribeToStream(streamId: string): void {
    if (!this.streamId) {
      console.error('StreamDetailsPage: No stream ID available to subscribe');
      return;
    }
    this.serverState?.subscribe(state => {
      const stream = state.server.streams.find(s => s.id === streamId);
      if (!stream) {
        console.error(`StreamDetailsPage: Stream with ID ${streamId} not found`);
        return;
      } else {
        this.stream = stream;
      }
    });
  }

  // get serverUrl from UserPreferences and append camillaDSP port
  async getCamillaDspUrl(): Promise<string> {
   let url: string;
    await Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
      url = result.value || '';
    });
    const camillaPort = this.streamCamillaDSPPort || 1235; // Default port if not set
    const websocket = "ws://" + url?.replace(/(^\w+:|^)\/\//, '') + `:${camillaPort}`;
    this.serverUrl = websocket;
    return websocket;
  }

}
