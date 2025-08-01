import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subscription, EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SnapcastService } from 'src/app/services/snapcast.service'; // Adjust path
import { Group, Client, Stream, ServerDetail, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model'; // Adjust path

@Component({
  selector: 'app-snapcast-status',
  templateUrl: './snapcast-status.component.html',
  styleUrls: ['./snapcast-status.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // If using standalone components, set to true
})
export class SnapcastStatusComponent implements OnInit, OnDestroy {
  
  displayState?: Observable<SnapCastServerStatusResponse | null>;

  private subscriptions = new Subscription();

  constructor(public snapcastService: SnapcastService) {
  
  }

  ngOnInit() {
    this.displayState = this.snapcastService.state$

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
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}