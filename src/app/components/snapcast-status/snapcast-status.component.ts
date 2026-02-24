import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subscription, EMPTY, firstValueFrom } from 'rxjs';
import { catchError, first, tap } from 'rxjs/operators';
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
    if(!state) return;
    
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}