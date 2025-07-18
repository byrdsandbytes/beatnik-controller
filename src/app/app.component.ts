import { Component, NgZone } from '@angular/core';
import { App } from '@capacitor/app';
import { SnapcastService } from './services/snapcast.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private ngZone: NgZone,
    private snapcastService: SnapcastService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    App.addListener('appStateChange', (state) => {
      // NOTE: This is my backup plan if state is still not refreshed
      this.ngZone.run(() => {
        if (state.isActive) {
          // App has come to the foreground
          console.log('App is in the foreground');
          // TODO: Refresh or establish connections to snapcast server
          this.snapcastService.connect();

          // Add your logic here to refresh data, update UI, etc.
        } else {
          // App has gone to the background
          console.log('App is in the background');
          // TODO: Destroy connections to snapcast server. But will see if this is a good idea. Maybe good to safe some pi resources.
          this.snapcastService.disconnect();
        }
      });
    });
  }
}
