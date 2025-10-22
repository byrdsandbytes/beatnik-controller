import { Injectable, NgZone } from '@angular/core';
import { BleClient, BleDevice, numbersToDataView, ScanResult } from '@capacitor-community/bluetooth-le';
import { result } from 'lodash-es';
import { BehaviorSubject, Observable, scan } from 'rxjs';

function stringToDataView(str: string): DataView {
  const encoder = new TextEncoder();
  return new DataView(encoder.encode(str).buffer);
}

// Use the UUIDs from your Python script
const PROVISIONING_SERVICE = '12345678-1234-5678-1234-56789abcdef0';
const SSID_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef1';
const PASS_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef2';
const CONNECT_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef3';
const STATUS_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef4';
const SCAN_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef5';

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
        name: 'beatnik-server',
      });

      this.updateStatus('Connecting...');
      await BleClient.connect(device.deviceId, (deviceId) => this.onDisconnect(deviceId));
      this.connectedDevice = device;
      this.updateStatus('Connected. Subscribing to status...');

      // Subscribe to status updates
      await BleClient.startNotifications(
        this.connectedDevice.deviceId,
        PROVISIONING_SERVICE,
        STATUS_CHARACTERISTIC,
        (value) => {
          console.log('Status notification received:', value);
          const status = new TextDecoder().decode(value);
          this.updateStatus(status);
        }
      );

      // Subscribe to scan results
      await BleClient.startNotifications(
        this.connectedDevice.deviceId,
        PROVISIONING_SERVICE,
        SCAN_CHARACTERISTIC,
        (value) => {
          const results = new TextDecoder().decode(value);
          this.parseAndUpdateNetworks(results);
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
    const result = await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      SCAN_CHARACTERISTIC,
      numbersToDataView([1])
    );
    console.log('Scan triggered, result:', result);
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
}
