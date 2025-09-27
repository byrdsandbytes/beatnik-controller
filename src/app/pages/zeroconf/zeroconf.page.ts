import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ZeroConf, ZeroConfService as ZeroConfServiceModel } from 'capacitor-zeroconf';
import { ZeroconfService } from '../../services/zero-conf.service';


@Component({
  selector: 'app-zeroconf',
  templateUrl: './zeroconf.page.html',
  styleUrls: ['./zeroconf.page.scss'],
  standalone: false,
})
export class ZeroconfPage implements OnDestroy {
  services$: Observable<ZeroConfServiceModel[]>;
  private readonly SERVICE_TYPE = '_snapcast._tcp.';
  isScanning = false;

  constructor(private zeroconf: ZeroconfService) {
    this.services$ = this.zeroconf.services$;
  }

  async ngOnInit() {
   
  }

  async scanForServices(): Promise<void> {
    this.isScanning = true;
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
    
    // Example of publishing a service
    // this.zeroconf.publish({
    //   type: '_my-app._tcp.',
    //   name: 'My Angular App',
    //   port: 8080
    // });
  
  
  // Clean up when the component is destroyed
  ngOnDestroy() {
    this.stopScan();
  }
}
