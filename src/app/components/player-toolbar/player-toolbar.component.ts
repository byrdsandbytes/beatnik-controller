import { Component, OnInit } from '@angular/core';
import { first, firstValueFrom, Observable, Subscription } from 'rxjs';
import { Group, Stream, ServerDetail } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-player-toolbar',
  templateUrl: './player-toolbar.component.html',
  styleUrls: ['./player-toolbar.component.scss'],
  standalone: false
})
export class PlayerToolbarComponent implements OnInit {


  public groups$: Observable<Group[]>;
  public streams$: Observable<Stream[]>;
  public serverDetails$: Observable<ServerDetail | undefined>;

  private subscriptions = new Subscription();

  constructor(public snapcastService: SnapcastService) {
    this.groups$ = this.snapcastService.groups$;
    this.streams$ = this.snapcastService.streams$;
    this.serverDetails$ = this.snapcastService.serverDetails$;
  }

  ngOnInit(): void {
    this.snapcastService.connect();
  }



  getPlayerStatus() {
    // this.playerStatusService.getPlayerStatus(this.baseIP)
  }

  setVolume(event: any) {
    const value = event.detail.value;
    console.log(value);
    // this.playerStatusService.setPlayerVolume(this.baseIP, event.detail.value);
  }

  pauseStream(streamId: string): void {
    this.snapcastService.streamControl(streamId, 'pause').subscribe({
      next: () => console.log(`Stream ${streamId} pause command sent.`),
      error: err => console.error(`Failed to play stream ${streamId}`, err)
    }
    );
  }

  setGroupVolume(event: any, group: Group): void {
    const clients = group.clients || [];
    const value = event.detail.value;
    console.log(`Setting volume for group ${group.id} to ${value}`);
    for (const client of clients) {
      this.subscriptions.add(
        this.snapcastService.setClientVolumePercent(client.id, value).subscribe({
          next: () => console.log(`Volume for client ${client.id} set to ${value}`),
          error: err => console.error(`Failed to set volume for client ${client.id}`, err)
        })
      );
    }



  }

  setStreamVolume(event: any, stream: Stream): void {
    const value = event.detail.value;
    console.log(`Setting volume for stream ${stream.id} to ${value}`);
  }

   calculateStreamVolumeBasedOnClients(stream: Stream): number {
    const streamId = stream.id;
    const groups =  firstValueFrom(this.groups$).then(groups => groups.filter(group => group.stream_id === streamId));
    let totalVolume = 0;
    let clientCount = 0;
    groups.then(groups => {
      for (const group of groups) {
        const clients = group.clients || [];
        for (const client of clients) {
          if (client.config && client.config.volume && typeof client.config.volume.percent === 'number') {
            totalVolume += client.config.volume.percent;
            clientCount++;
          }
        }
      }
      return clientCount > 0 ? totalVolume / clientCount : 0;
    }
    ).catch(err => {
      console.error(`Failed to calculate stream volume for ${stream.id}`, err);
      return 0;
    }
    );
    return 0; // Default return value in case of error or no clients
   
  }




}
