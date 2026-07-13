import { Component, NgZone } from '@angular/core';
import { App } from '@capacitor/app';
import { SnapcastService } from './services/snapcast.service';
import { ZeroconfService } from './services/zero-conf.service';
import { Observable } from 'rxjs';
import { ZeroConf, ZeroConfService as ZeroConfServiceModel } from 'capacitor-zeroconf';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from './enum/user-preference.enum';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  readonly SERVICE_SNAPCAST = '_snapcast._tcp.';
  services$: Observable<ZeroConfServiceModel[]>;
  scanForDevicesOnStartup: boolean = false;


  constructor(
    private ngZone: NgZone,
    private snapcastService: SnapcastService,
    private zeroconfService: ZeroconfService
  ) {
    this.initializeApp();

  }

  initializeApp() {
    this.snapcastService.connect();
    App.addListener('appStateChange', (state) => {
      // NOTE: This is my backup plan if state is still not refreshed
      this.ngZone.run(() => {
        if (state.isActive) {
          // App has come to the foreground
          console.log('App is in the foreground');
          // TODO: Refresh or establish connections to snapcast server
          try {
            this.snapcastService.connect();
          } catch (error) {
            console.error('Error connecting to Snapcast server:', error);
          }

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
