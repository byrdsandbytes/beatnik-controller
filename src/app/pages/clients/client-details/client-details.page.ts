import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Client, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
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
  public client?: Client;


  constructor(
    private avtivateRoute: ActivatedRoute,
    private snapcastService: SnapcastService
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
    this.serverState.subscribe((state) => {
      this.client = state.server.groups.flatMap(group => group.clients).find(client => client.id === this.id);
      if (!this.client) {
        console.error(`ClientDetailsPage: Client with ID ${this.id} not found in server state`);
      } else {
        console.log('ClientDetailsPage: Found client:', this.client);
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



}
