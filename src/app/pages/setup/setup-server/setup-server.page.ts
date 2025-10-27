import { Component, OnInit } from '@angular/core';
import { ZeroconfService } from 'src/app/services/zero-conf.service';
import { ZeroConf, ZeroConfService as ZeroConfServiceModel } from 'capacitor-zeroconf';
import { firstValueFrom, Observable } from 'rxjs';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { ServerDetail, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';


@Component({
  selector: 'app-setup-server',
  templateUrl: './setup-server.page.html',
  styleUrls: ['./setup-server.page.scss'],
  standalone: false,
})
export class SetupServerPage implements OnInit {

  services$: Observable<ZeroConfServiceModel[]>;
  private readonly SERVICE_TYPE = '_snapcast._tcp.';
  isScanning = false;
  state: 'initial' | 'scanning' | 'manual' | 'selected' | 'deviceFound' = 'initial';
  snapcastServerStatus: Observable<SnapCastServerStatusResponse> | null = null;

  constructor(
    private zeroconf: ZeroconfService,
    private snapcastService: SnapcastService
  ) {
    this.services$ = this.zeroconf.services$;
  }

  async ngOnInit() {
    this.services$.subscribe(services => {
      if (services.length > 0) {
        this.state = 'deviceFound';
        this.connectToSnapcast(services[0]);

      }
    });
  }

  async scanForServices(): Promise<void> {
    this.isScanning = true;
    this.state = 'scanning';
    try {
      await this.zeroconf.watch(this.SERVICE_TYPE);
      console.log(`Started scanning for services of type: ${this.SERVICE_TYPE}`);
    }
    catch (error) {
      console.error('Error starting service scan:', error);
    }
  }

  async getHostname(): Promise<void> {
    try {
      const result = await ZeroConf.getHostname();
      console.log('Hostname:', result.hostname);
    } catch (error) {
      console.error('Error getting hostname:', error);
    }
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
    try {
      await this.zeroconf.stop();
      console.log('Stopped scanning for services.');
    } catch (error) {
      console.error('Error stopping service scan:', error);
    }
  }

  async openManualEntry(): Promise<void> {
    // Logic to open a modal or navigate to a page for manual IP entry
    console.log('Manual IP entry not implemented yet.');
  }

  async selectService(service: ZeroConfServiceModel): Promise<void> {
    // Logic to handle the selected service, e.g., save its IP and port
    console.log('Selected service:', service);
  }

  async connectToSnapcast(service: ZeroConfServiceModel): Promise<void> {
    console.log('Connecting to Snapcast service:', service);
    console.log('hostname:', service.hostname);
    console.log('port:', service.port);
    // remove any trailing dot from the hostname
    if (service.hostname.endsWith('.')) {
      service.hostname = service.hostname.slice(0, -1);
    }
    
    try {
      await this.snapcastService.connect(service.ipv4Addresses[0],undefined, true);

      console.log('Connected to service:', service);
      // this.state = 'selected';
    } catch (error) {
      console.error('Error connecting to service:', error);
    }

    try {
      this.snapcastServerStatus = this.snapcastService.state$
      console.log('Fetching server status...');
      const status = await firstValueFrom(this.snapcastServerStatus);
      console.log('Server status:', status);
    } catch (error) {
      console.error('Error fetching server status:', error);
    }
  }


}
