import { Injectable, NgZone } from '@angular/core';
import { BleClient, BleDevice, numbersToDataView, ScanResult } from '@capacitor-community/bluetooth-le';
import { result } from 'lodash-es';
import { BehaviorSubject, Observable, scan } from 'rxjs';

function stringToDataView(str: string): DataView {
  const encoder = new TextEncoder();
  return new DataView(encoder.encode(str).buffer);
}

// Nordic UART Service inspired UUIDs
const PROVISIONING_SERVICE = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E';
const SSID_CHARACTERISTIC = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E';
const PASS_CHARACTERISTIC = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E';
const CONNECT_CHARACTERISTIC = '6E400004-B5A3-F393-E0A9-E50E24DCCA9E';
const STATUS_CHARACTERISTIC = '6E400005-B5A3-F393-E0A9-E50E24DCCA9E';
const SCAN_CHARACTERISTIC = '6E400006-B5A3-F393-E0A9-E50E24DCCA9E';

export interface WifiNetwork {
  ssid: string;
  signalStrength: number;
  security: string;
}

@Injectable({
  providedIn: 'root'
})
export class BleWifiProvisioningService {
  private connectedDevice: BleDevice | undefined;
  private statusSubject = new BehaviorSubject<string>('Disconnected');
  private networksSubject = new BehaviorSubject<WifiNetwork[]>([]);
  public status$: Observable<string> = this.statusSubject.asObservable();
  public networks$: Observable<WifiNetwork[]> = this.networksSubject.asObservable();

  public scanResults: BehaviorSubject<ScanResult[]> = new BehaviorSubject<ScanResult[]>([]);
  private scanResultsArray: ScanResult[] = [];

  constructor(private ngZone: NgZone) { }

  async scanAndConnect(): Promise<void> {
    try {
      await BleClient.initialize();

      this.updateStatus('Scanning...');
      const device = await BleClient.requestDevice({
        // services: [PROVISIONING_SERVICE],
        name: 'beatnik',
      });

      this.updateStatus('Connecting...');
      await BleClient.connect(device.deviceId, (deviceId) => this.onDisconnect(deviceId));
      this.connectedDevice = device;
      console.log('Connected device:', this.connectedDevice);
      
      // Make sure services are discovered first
      this.updateStatus('Discovering services...');

      const services = await BleClient.getServices(device.deviceId);
      console.log('Available services:', services);
      
      const hasProvisioningService = services.some((s: { uuid: string }) => 
        s.uuid.toLowerCase() === PROVISIONING_SERVICE.toLowerCase()
      );
      if (!hasProvisioningService) {
        throw new Error(`Device does not have the provisioning service ${PROVISIONING_SERVICE}`);
      }
      
      this.updateStatus('Setting up notifications...');
      
      // Subscribe to status updates
      BleClient.startNotifications(
        this.connectedDevice.deviceId,
        PROVISIONING_SERVICE,
        STATUS_CHARACTERISTIC,
        (value) => {
          console.log('Status notification received - raw value:', value);
          console.log('Value type:', value.constructor.name);
          console.log('Value buffer:', Array.from(new Uint8Array(value.buffer)));
          
          try {
            const status = new TextDecoder().decode(value);
            console.log('Decoded status:', status);
            this.updateStatus(status);
          } catch (error) {
            console.error('Error decoding status:', error);
            // Try alternative decoding if the value is a DataView
            if (value instanceof DataView) {
              const bytes = new Uint8Array(value.buffer);
              const status = new TextDecoder().decode(bytes);
              console.log('Decoded status from DataView:', status);
              this.updateStatus(status);
            }
          }
        }
      );


      // Subscribe to scan results
      await BleClient.startNotifications(
        this.connectedDevice.deviceId,
        PROVISIONING_SERVICE,
        SCAN_CHARACTERISTIC,
        (value) => {
          console.log('Scan notification received - raw value:', value);
          console.log('Value type:', value.constructor.name);
          console.log('Value buffer:', Array.from(new Uint8Array(value.buffer)));
          
          try {
            const results = new TextDecoder().decode(value);
            console.log('Decoded scan results:', results);
            this.parseAndUpdateNetworks(results);
          } catch (error) {
            console.error('Error decoding scan results:', error);
            // Try alternative decoding if the value is a DataView
            if (value instanceof DataView) {
              const bytes = new Uint8Array(value.buffer);
              const results = new TextDecoder().decode(bytes);
              console.log('Decoded scan results from DataView:', results);
              this.parseAndUpdateNetworks(results);
            }
          }
        }
      );

    } catch (error) {
      console.error('Scan or connect error:', error);
      this.updateStatus(`Error: ${(error as Error).message}`);
    }
  }

  async provision(ssid: string, password: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('Not connected to a device.');
    }

    this.updateStatus('Writing credentials...');
    // Write SSID
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      SSID_CHARACTERISTIC,
      stringToDataView(ssid)
    );

    // Write Password
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      PASS_CHARACTERISTIC,
      stringToDataView(password)
    );

    this.updateStatus('Triggering connection...');
    console.log('this.connectedDevice:', this.connectedDevice);
    // Write to trigger connection
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      CONNECT_CHARACTERISTIC,
      numbersToDataView([1]) // Any value will do
    );
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      await BleClient.disconnect(this.connectedDevice.deviceId);
    }
    this.onDisconnect(this.connectedDevice?.deviceId || '');
  }

  private onDisconnect(deviceId: string): void {
    this.connectedDevice = undefined;
    this.updateStatus('Disconnected');
    console.log(`Device ${deviceId} disconnected.`);
  }

  private updateStatus(status: string): void {
    // Run in NgZone to ensure UI updates
    this.ngZone.run(() => {
      this.statusSubject.next(status);
      console.log(`Status: ${status}`);
    });
  }

  async scanWifiNetworks(): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('Not connected to a device');
    }

    // Write any value to trigger scan
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      SCAN_CHARACTERISTIC,
      numbersToDataView([1])
    );

    // const result = BleClient.read(
    //   this.connectedDevice.deviceId,
    //   PROVISIONING_SERVICE,
    //   SCAN_CHARACTERISTIC
    // ).then(value => {
    //   const results = new TextDecoder().decode(value);
    //   console.log('Decoded scan results from read():', results);
    //   this.parseAndUpdateNetworks(results);
    // }).catch(error => {
    //   console.error('Error reading scan results:', error);
    // });
    // console.log('Scan triggered, result:', result);
  }

  private parseAndUpdateNetworks(results: string): void {
    if (results === 'Scanning...') {
      return;
    }

    const networks = results.split(';')
      .map(network => {
        const [ssid, signal, security] = network.split('|');
        return {
          ssid,
          signalStrength: parseInt(signal, 10),
          security
        };
      })
      .filter(n => n.ssid); // Filter out empty SSIDs

    this.ngZone.run(() => {
      this.networksSubject.next(networks);
    });
  }

  scanForDevices(): void {
    BleClient.requestLEScan({}, (result) => {
      console.log('Scan result:', result);
      this.scanResultsArray.push(result as ScanResult);
      this.ngZone.run(() => {
        this.scanResults.next(this.scanResultsArray);
      });
    });
  }

  readWifiNetworks(): void {
    BleClient.read(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      SCAN_CHARACTERISTIC
    ).then(value => {
      const results = new TextDecoder().decode(value);
      console.log('Decoded scan results from read():', results);
      this.parseAndUpdateNetworks(results);
    }).catch(error => {
      console.error('Error reading scan results:', error);
    });
  }

  readConnectionStatus(): void {
    BleClient.read(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      STATUS_CHARACTERISTIC
    ).then(value => {
      const status = new TextDecoder().decode(value);
      console.log('Decoded connection status from read():', status);
      this.updateStatus(status);
    }).catch(error => {
      console.error('Error reading connection status:', error);


    });
  }
}
