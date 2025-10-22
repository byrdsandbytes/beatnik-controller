import { Component } from '@angular/core';
import { BleWifiProvisioningService, WifiNetwork } from 'src/app/services/ble-wifi-provisioning.service';
import { AlertController } from '@ionic/angular';
import { ScanResult } from '@capacitor-community/bluetooth-le';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-ble-wifi-provisioning',
  templateUrl: './ble-wifi-provisioning.page.html',
  styleUrls: ['./ble-wifi-provisioning.page.scss'],
  standalone: false
})
export class BleWifiProvisioningPage {
  ssid = '';
  password = '';

  scanResults: Observable<ScanResult[]>;
  network$: Observable<WifiNetwork[]>;

  constructor(
    public bleService: BleWifiProvisioningService,
    private alertCtrl: AlertController
  ) {
    this.scanResults = this.bleService.scanResults;
    this.network$ = this.bleService.networks$;
  }

  async scan(): Promise<void> {
    await this.bleService.scanAndConnect();
  }

  async startProvisioning(): Promise<void> {
    try {
      await this.bleService.provision(this.ssid, this.password);
    } catch (error) {
      this.showAlert('Error', (error as Error).message);
    }
  }

  async disconnect(): Promise<void> {
    await this.bleService.disconnect();
  }


  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // async scanForDevices(): Promise<void> {
    
  //   const result = await this.bleService.requestLeScan();
  //   console.log('Scan result:', result);
  //   this.scanResult = result as ScanResult;
    
  // }
}
