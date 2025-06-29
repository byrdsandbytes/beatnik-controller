import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
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

}
