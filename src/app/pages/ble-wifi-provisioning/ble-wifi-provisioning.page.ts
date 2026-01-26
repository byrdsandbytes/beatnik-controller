import { Component } from '@angular/core';
// import { BleWifiProvisioningService, WifiNetwork } from 'src/app/services/ble-wifi-provisioning.service';
import { AlertController } from '@ionic/angular';
import { ScanResult } from '@capacitor-community/bluetooth-le';
import { Observable } from 'rxjs';
import { BeatnikBlenoService, BleNetwork, WifiStatus } from 'src/app/services/beatnik-bleno.service';

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


  blenoDeviceId: Observable<string | null> = this.beatikBlenoService.deviceId$;

  deviceConnectionStatus$: Observable<'Disconnected' | 'Scanning' | 'Connecting' | 'Connected'> = this.beatikBlenoService.deviceConnectionStatus$;
  wifiConnectionStatus: Observable<WifiStatus> = this.beatikBlenoService.wifiStatus$;
  availableNetworks$: Observable<BleNetwork[]> = this.beatikBlenoService.availableNetworks$;

  constructor(
    // public bleService: BleWifiProvisioningService,
    private alertCtrl: AlertController,
    private beatikBlenoService: BeatnikBlenoService
  ) {
    // this.scanResults = this.bleService.scanResults;
    // this.network$ = this.bleService.networks$;
  }



  async disconnect(): Promise<void> {
    // await this.bleService.disconnect();
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

  async scanForDevices(): Promise<void> {
    const result = await this.beatikBlenoService.findAndConnect();
    console.log('Scan result:', result);
  }

  // async provisionWifi(deviceId: string, ssid: string, password: string): Promise<void> {
  //   await this.beatikBlenoService.provisionWifi(deviceId, ssid, password);
  // }
}
