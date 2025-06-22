import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-devices',
  templateUrl: './devices.page.html',
  styleUrls: ['./devices.page.scss'],
  standalone: false,
})
export class DevicesPage implements OnInit {

  serverState?: Observable<SnapCastServerStatusResponse>;

  constructor(
    private snapcastService: SnapcastService 
  ) { }

  ngOnInit() {
    this.serverState = this.snapcastService.state$;

    

  }

}
