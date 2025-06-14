// player-toolbar.component.ts
import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core'; // OnChanges und SimpleChanges hinzugefügt
import { Observable, Subscription, tap, firstValueFrom } from 'rxjs'; // firstValueFrom hinzugefügt
import { Group, Stream, ServerDetail, Client, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model'; // Client importiert für Typisierung
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-player-toolbar',
  templateUrl: './player-toolbar.component.html',
  styleUrls: ['./player-toolbar.component.scss'],
  standalone: false, 
})
export class PlayerToolbarComponent implements OnInit, OnChanges, OnDestroy {

  // This is the primary state observable for the component.
  public displayState$: Observable<SnapCastServerStatusResponse | null>;

  private subscriptions = new Subscription();

  constructor(
    public snapcastService: SnapcastService
  ) {
    // The component subscribes to the main displayState$.
    // The async pipe in the template will handle unwrapping it.
    this.displayState$ = this.snapcastService.displayState$.pipe(
      tap(state => console.log('%cPlayerToolbarComponent: displayState$ received', 'color: orange; font-weight: bold;', new Date().toLocaleTimeString(), state))
    );
  }

  ngOnInit(): void {
    // The service connection should ideally be initiated once at the application's root level (e.g., AppComponent).
    // Calling it here is fine, but be aware that it will re-trigger on every component initialization.
    this.snapcastService.connect();
  }

  /**
   * This lifecycle hook is only triggered if the component has @Input() properties
   * that receive new values. If there are no inputs, this method can be removed.
   */
  ngOnChanges(changes: SimpleChanges): void {
    console.log('PlayerToolbarComponent: ngOnChanges triggered', changes);
  }

  /**
   * Handles a volume change event for a specific client.
   * @param client The client object whose volume is being changed.
   * @param event The event emitted from the range slider (e.g., ionChange).
   */
  changeVolumeForClient(client: Client, event: any): void {
    // Step 1: Robustly extract the numerical value from the event.
    // Ionic's ion-range often uses `event.detail.value`.
    let newVolume: number;
    if (event && typeof event.detail?.value === 'number') {
      newVolume = event.detail.value;
    } else if (event && event.target && typeof event.target.value !== 'undefined') {
      newVolume = parseFloat(event.target.value);
    } else {
      console.error('PlayerToolbarComponent: Could not extract volume value from event:', event);
      return;
    }

    if (isNaN(newVolume)) {
      console.error('PlayerToolbarComponent: Volume value is not a number:', event);
      return;
    }

    console.log(`PlayerToolbarComponent: Setting desired volume for client ${client.id} to ${newVolume}`);

    // Step 2: Call the service method.
    // The service will optimistically update the `desiredState`, which makes the UI feel instant.
    // It then sends the RPC command to the server.
    const volumeUpdate$ = this.snapcastService.setClientVolumePercent(client.id, newVolume);

    // Step 3: Subscribe to handle the result of the RPC call (especially errors).
    // This subscription is managed to prevent memory leaks.
    this.subscriptions.add(
      volumeUpdate$.subscribe({
        next: () => {
          // The UI has already updated optimistically. This confirms the RPC was sent.
          console.log(`PlayerToolbarComponent: RPC for client ${client.id} volume sent successfully.`);
        },
        error: err => {
          // If the RPC fails, the service should ideally handle rolling back the desiredState.
          // The component can show a user-facing error here.
          console.error(`PlayerToolbarComponent: Failed to set volume for client ${client.id}`, err);
          // Example: this.toastController.create({ message: 'Failed to change volume', ... }).present();
        }
      })
    );
  }

  /**
   * Good practice: Implement OnDestroy to clean up all manual subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}