import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SnapcastService } from 'src/app/services/snapcast.service'; // Adjust path
import { Group, Client, Stream, ServerDetail } from 'src/app/model/snapcast.model'; // Adjust path

@Component({
  selector: 'app-snapcast-status',
  templateUrl: './snapcast-status.component.html',
  styleUrls: ['./snapcast-status.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // If using standalone components, set to true
})
export class SnapcastStatusComponent implements OnInit, OnDestroy {
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

  getClientDetails(clientId: string): Observable<Client | undefined> {
    return this.snapcastService.getClient(clientId);
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

  onToggleClientMute(client: Client): void {
    const newMuteState = !client.config.volume.muted;
    this.subscriptions.add(
      this.snapcastService.setClientMute(client.id, newMuteState).pipe(
        catchError(err => {
          console.error(`Component: Failed to toggle mute for ${client.id}`, err);
          return EMPTY;
        })
      ).subscribe()
    );
  }

  onChangeGroupName(groupId: string, newName: string): void {
    if (!newName || !newName.trim()) return;
    this.subscriptions.add(
      this.snapcastService.setGroupName(groupId, newName.trim()).pipe(
        catchError(err => {
          console.error(`Component: Failed to change group name for ${groupId}`, err);
          return EMPTY;
        })
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}