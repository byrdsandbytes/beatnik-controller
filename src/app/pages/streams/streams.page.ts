import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SnapcastWebsocketNotification } from 'src/app/model/snapcast-websocket-notification.model';
import { SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-streams',
  templateUrl: './streams.page.html',
  styleUrls: ['./streams.page.scss'],
  standalone: false,
})
export class StreamsPage implements OnInit {
  displayState?: Observable<SnapCastServerStatusResponse | null>;

  constructor(
    private readonly snapcastService: SnapcastService,
  ) { }

  ngOnInit() {
    this.displayState = this.snapcastService.state$
  }

  convertBase64ToImage(base64String: string, format: string): string {
    return `data:image/${format};base64,${base64String}`;
  }

}
