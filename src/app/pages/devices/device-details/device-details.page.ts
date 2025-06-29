import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { SnapCastServerStatusResponse, Stream } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-device-details',
  templateUrl: './device-details.page.html',
  styleUrls: ['./device-details.page.scss'],
  standalone: false
})
export class DeviceDetailsPage implements OnInit {

  id?: string;

  serverState?: Observable<SnapCastServerStatusResponse>;

  constructor(
    private avtivateRoute: ActivatedRoute,
    private snapcastService: SnapcastService
  ) { }

  async ngOnInit() {
    this.serverState = this.snapcastService.state$;
    this.id = this.avtivateRoute.snapshot.paramMap.get('id') || undefined;
    if (!this.id) {
      console.error('DeviceDetailsPage: No ID found in route parameters');
      return;
    }
    console.log('DeviceDetailsPage: ID from route parameters:', this.id);

  }


  changeGroupName(newName: string): void {
    if (!this.id) {
      console.error('DeviceDetailsPage: No ID available to change group name');
      return;
    }
    this.snapcastService.setGroupName(this.id, newName).subscribe({
      next: () => {
        console.log(`DeviceDetailsPage: Group name changed to ${newName} for ID ${this.id}`);
      },
      error: (error) => {
        console.error(`DeviceDetailsPage: Error changing group name for ID ${this.id}`, error);
      }
    });
  }

  changeStream(streamId: string): void {
    if (!this.id) {
      console.error('DeviceDetailsPage: No ID available to change stream');
      return;
    }
    this.snapcastService.setGroupStream(this.id, streamId).subscribe({
      next: () => {
        console.log(`DeviceDetailsPage: Stream changed to ${streamId} for ID ${this.id}`);
      },
      error: (error) => {
        console.error(`DeviceDetailsPage: Error changing stream for ID ${this.id}`, error);
      }
    });
  }
  

  

}
