import { Component } from '@angular/core';
import { SnapcastService } from './services/snapcast.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private snapcastService: SnapcastService
  ) {
    this.snapcastService.connect();

  }
}
