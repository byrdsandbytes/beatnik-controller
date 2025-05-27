import { Component, OnInit } from '@angular/core';
import { SnapcastWebsocketNotification } from 'src/app/model/snapcast-websocket-notification.model';
import { SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { SnapcastWebsocketNotificationService } from 'src/app/services/snapcast-websocket-notification.service';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-streams',
  templateUrl: './streams.page.html',
  styleUrls: ['./streams.page.scss'],
  standalone: false,
})
export class StreamsPage implements OnInit {
  state: SnapCastServerStatusResponse | undefined;

  constructor(
    private readonly snapcastService: SnapcastService,
    private readonly snapcastWebsocketNotificationService: SnapcastWebsocketNotificationService
  ) { }

  ngOnInit() {
    // this.snapcastService.connect();
    // this.snapcastService.status.subscribe(status => {
    //   console.log('Server Status:', status);
    //   this.state = status;
    // });

    // const result = this.snapcastService.subscribeToWebSocket();
    // result.subscribe({
    //   next: async (message) => {
    //     console.log('WebSocket message received:', message);
    //     const parsedMessage = message as SnapcastWebsocketNotification;
    //     this.state = await this.snapcastWebsocketNotificationService.handleNotification(parsedMessage, this.state!)
    //     console.log('Updated State:', this.state);
    //   },
    //   error: (error) => {
    //     console.error('WebSocket error:', error);
    //   },
    //   complete: () => {
    //     console.log('WebSocket connection closed');
    //   }
    // });

   
  }

  convertBase64ToImage(base64String: string, format: string): string {
    return `data:image/${format};base64,${base64String}`;
  }

}
