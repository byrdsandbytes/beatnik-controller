import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { first, firstValueFrom, Observable, Subscription, tap } from 'rxjs';
import { Group, Stream, ServerDetail } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-player-toolbar',
  templateUrl: './player-toolbar.component.html',
  styleUrls: ['./player-toolbar.component.scss'],
  standalone: false
})
export class PlayerToolbarComponent implements OnInit, OnChanges {



  public groups$: Observable<Group[]>;
  public streams$: Observable<Stream[]>;
  public serverDetails$: Observable<ServerDetail | undefined>;

  private subscriptions = new Subscription();

  constructor(public snapcastService: SnapcastService) {
    this.groups$ = this.snapcastService.groups$;
    this.streams$ = this.snapcastService.streams$;
    this.serverDetails$ = this.snapcastService.serverDetails$;
    this.groups$ = this.snapcastService.groups$.pipe(
      tap(groups => console.log('%cPlayerToolbarComponent: received groups$ update', 'color: orange; font-weight: bold;', new Date().toLocaleTimeString(), groups))
    );
  }

  ngOnInit(): void {
    this.snapcastService.connect();
    this.groups$.subscribe(groups => {
      console.log("groups", groups)
    });
  }

  ngOnChanges(): void {
    console.log('PlayerToolbarComponent: ngOnChanges called');
  }

  pauseStream(streamId: string): void {
    this.snapcastService.streamControl(streamId, 'pause').subscribe({
      next: () => {
        console.log(`Stream ${streamId} pause command sent.`)
      },
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

  streamVolumeChanged(){
    console.log('Stream volume changed for group');
    this.snapcastService.groups$.subscribe(groups => {
      console.log('Updated groups:', groups);
    });

  }

  

  




}
