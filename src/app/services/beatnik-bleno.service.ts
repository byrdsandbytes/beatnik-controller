import { Injectable } from '@angular/core';
import {
  BleClient,
  ScanResult,
  dataViewToText,
  textToDataView,
  numbersToDataView,
} from '@capacitor-community/bluetooth-le';
import { BehaviorSubject } from 'rxjs';

export interface BleNetwork {
  ssid: string;
  quality: number;
  security: string;
}

export interface WifiStatus {
  connected: boolean;
  ssid?: string;
  ip?: string;
  hostname?: string;
  deviceId?: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class BeatnikBlenoService {
  // Use lowercase UUIDs for compatibility
  private readonly SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  private readonly SSID_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
  private readonly PASS_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
  private readonly CONNECT_CHAR = '6e400004-b5a3-f393-e0a9-e50e24dcca9e';
  private readonly STATUS_CHAR = '6e400005-b5a3-f393-e0a9-e50e24dcca9e';
  private readonly SCAN_NETWORKS_CHAR = '6e400006-b5a3-f393-e0a9-e50e24dcca9e';
  private readonly NETWORK_LIST_CHAR = '6e400007-b5a3-f393-e0a9-e50e24dcca9e';

  // Observables for state management
  public readonly wifiStatus$ = new BehaviorSubject<WifiStatus>({
    connected: false,
    message: 'Not Connected',
  });
  public readonly deviceConnectionStatus$ = new BehaviorSubject<
    'Disconnected' | 'Scanning' | 'Connecting' | 'Connected'
  >('Disconnected');
  public readonly deviceId$ = new BehaviorSubject<string | null>(null);
  public readonly availableNetworks$ = new BehaviorSubject<BleNetwork[]>([]);

  private deviceId: string | null = null;

  constructor() {}

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Scans for, connects to, and prepares the device for interaction.
   */
  async findAndConnect(): Promise<void> {
    try {
      console.log('Initializing BLE...');
      await BleClient.initialize();
      this.deviceConnectionStatus$.next('Scanning');

      console.log('Requesting BLE device...');
      const device = await BleClient.requestDevice({
        // name: 'beatnik',
        services: [
          this.SERVICE, // Only request the main service UUID
          '0000180a-0000-1000-8000-00805f9b34fb', // Device Information Service
        ],
      });

      if (device) {
        await this.handleFoundDevice({ device });
      } else {
        throw new Error('No device found');
      }
    } catch (error) {
      console.error('Error during scan/connect:', error);
      this.deviceConnectionStatus$.next('Disconnected');
    }
  }

  async findAndConnectWithouhtDialog(): Promise<void> {
    try {
      console.log('Initializing BLE...');
      await BleClient.initialize();
      this.deviceConnectionStatus$.next('Scanning');
      console.log('Scanning for BLE devices...');
      // use requestLeScan instead of requestDevice to avoid dialog
      const scanResult = await BleClient.requestLEScan(
        {
          services: [this.SERVICE, '0000180a-0000-1000-8000-00805f9b34fb'],
          allowDuplicates: false,
        },
        (result) => {
          console.log('Scan result:', result);
          if (result.device) {
            console.log('Found device during scan:', result.device);
            this.handleFoundDevice(result);
            BleClient.stopLEScan();
          }
        }
      );
    } catch (error) {
      console.error('Error during scan/connect:', error);
      this.deviceConnectionStatus$.next('Disconnected');
    }
  }

  private async handleFoundDevice(result: { device: any }): Promise<void> {
    if (!result.device) return;

    this.deviceId = result.device.deviceId;
    this.deviceId$.next(this.deviceId);
    console.log('Device found:', this.deviceId);

    try {
      this.deviceConnectionStatus$.next('Connecting');

      console.log('Connecting to device...');
      await BleClient.connect(this.deviceId, () => this.onDisconnect());
      console.log('Connection successful.');

      // Get services and characteristics
      console.log('Discovering services...');
      const services = await BleClient.getServices(this.deviceId);
      console.log('Available services:', JSON.stringify(services, null, 2));

      // Find our service
      const provisioningService = services.find(
        (s) => s.uuid.toLowerCase() === this.SERVICE.toLowerCase()
      );

      if (!provisioningService) {
        console.error(
          'Available services:',
          services.map((s) => s.uuid)
        );
        throw new Error(`Provisioning service ${this.SERVICE} not found`);
      }

      console.log('Found provisioning service:', provisioningService);

      // Log all characteristics for debugging
      if (provisioningService.characteristics) {
        console.log(
          'Service characteristics:',
          provisioningService.characteristics.map((c) => ({
            uuid: c.uuid,
            properties: c.properties,
          }))
        );
      }

      // Short delay to ensure characteristics are ready
      await this.sleep(2000);

      // Try to read the device information first
      try {
        console.log('Reading device information...');
        const deviceInfo = await BleClient.read(
          this.deviceId,
          '0000180a-0000-1000-8000-00805f9b34fb',
          '00002a50-0000-1000-8000-00805f9b34fb'
        );
        console.log(
          'Device information:',
          new TextDecoder().decode(deviceInfo)
        );
      } catch (error) {
        console.warn('Could not read device information:', error);
      }

      try {
        console.log('Verifying provisioning service access...');
        // First try to write to SSID characteristic (it should be writable)
        await BleClient.write(
          this.deviceId,
          this.SERVICE,
          this.SSID_CHAR,
          textToDataView('test')
        );
        console.log('Successfully verified write access');
      } catch (error) {
        console.error('Error verifying service access:', error);
        throw new Error('Could not access service characteristics');
      }

      await this.subscribeToStatusNotifications();

      this.deviceConnectionStatus$.next('Connected');
      console.log('Device is ready.');

      await this.subscribeToStatusNotifications();
      await this.subscribeToNetworkList();
      await this.scanForWifiNetworks();
    } catch (error) {
      console.error('Error handling device:', error);
      this.disconnect();
    }
  }

  /**
   * Subscribes to WiFi status updates from the device.
   */
  private async subscribeToStatusNotifications(): Promise<void> {
    if (!this.deviceId) {
      console.error('Cannot subscribe to notifications - no device ID');
      return;
    }

    try {
      console.log('Setting up status notifications...');
      console.log('Using characteristic:', this.STATUS_CHAR);

      await BleClient.startNotifications(
        this.deviceId,
        this.SERVICE,
        this.STATUS_CHAR,
        (dataView) => {
          console.log('Status notification received:', {
            type: dataView.constructor.name,
            buffer: Array.from(new Uint8Array(dataView.buffer)),
          });

          try {
            const statusString = dataViewToText(dataView);
            console.log('Decoded status:', statusString);

            try {
              const status: WifiStatus = JSON.parse(statusString);
              this.wifiStatus$.next(status);
            } catch (e) {
              // Fallback for plain text
              this.wifiStatus$.next({
                connected: false,
                message: statusString,
              });
            }
          } catch (error) {
            console.error('Error decoding status notification:', error);
          }
        }
      );

      console.log('Successfully subscribed to status notifications');
    } catch (error) {
      console.error('Error setting up status notifications:', error);
      throw error;
    }
    console.log('Subscribed to status notifications.');
  }

  /**
   * Sends WiFi credentials to the device and triggers the connection.
   */
  async provisionWifi(ssid: string, password: string): Promise<void> {
    if (this.deviceConnectionStatus$.value !== 'Connected' || !this.deviceId) {
      console.error('Device not connected.');
      return;
    }

    try {
      console.log('Writing SSID:', ssid);
      // Use the textToDataView helper for encoding
      await BleClient.write(
        this.deviceId,
        this.SERVICE,
        this.SSID_CHAR,
        textToDataView(ssid)
      );
      await this.sleep(500); // Wait for server to process

      console.log('Writing password');
      await BleClient.write(
        this.deviceId,
        this.SERVICE,
        this.PASS_CHAR,
        textToDataView(password)
      );
      await this.sleep(500); // Wait for server to process

      console.log('Triggering connection');
      // Use numbersToDataView for the trigger command
      // The characteristic seems to prefer WriteWithoutResponse based on logs
      await BleClient.writeWithoutResponse(
        this.deviceId,
        this.SERVICE,
        this.CONNECT_CHAR,
        numbersToDataView([1])
      );

      console.log('WiFi credentials sent successfully');
    } catch (error) {
      console.error('Error sending WiFi credentials:', error);
      throw error;
    }

    console.log('WiFi credentials sent.');
  }

  // try to get network list in chunks

  async subscribeToNetworkList(): Promise<void> {
    if (!this.deviceId) {
      throw new Error('Device not connected');
    }

    let accumulatedData = ''; // Buffer to store chunks

    try {
      console.log('Subscribing to network list notifications...');
      await BleClient.startNotifications(
        this.deviceId,
        this.SERVICE,
        this.NETWORK_LIST_CHAR,
        (dataView) => {
          const chunk = dataViewToText(dataView);
          accumulatedData += chunk;

          // Try to parse the accumulated data
          try {
            // Check if it looks like a complete JSON array (starts with [ and ends with ])
            if (
              accumulatedData.trim().startsWith('[') &&
              accumulatedData.trim().endsWith(']')
            ) {
              const networks: BleNetwork[] = JSON.parse(accumulatedData);
              console.log('Received network list:', networks);
              this.availableNetworks$.next(networks);
              accumulatedData = ''; // Reset buffer after successful parse
            }
          } catch (error) {
            // It's expected to fail while we are still receiving chunks
            // console.debug('Waiting for more chunks...');
          }
        }
      );
      console.log('Successfully subscribed to network list.');
    } catch (error) {
      console.error('Error subscribing to network list:', error);
    }
  }

  /**
   * Triggers a WiFi scan on the remote device.
   */
  async scanForWifiNetworks(): Promise<void> {
    if (!this.deviceId) {
      throw new Error('Device not connected');
    }

    try {
      console.log('Sending command to scan for networks...');
      // Write '1' (as a single byte) to the scan characteristic
      await BleClient.write(
        this.deviceId,
        this.SERVICE,
        this.SCAN_NETWORKS_CHAR,
        numbersToDataView([1])
      );
      console.log('Scan command sent successfully.');
    } catch (error) {
      console.error('Error triggering WiFi scan:', error);
    }
  }

  /**
   * Handles device disconnection.
   */
  private onDisconnect(): void {
    this.deviceId = null;
    this.deviceConnectionStatus$.next('Disconnected');
    console.log('Device disconnected.');
  }

  /**
   * Manually disconnects from the device.
   */
  async disconnect(): Promise<void> {
    if (this.deviceId) {
      await BleClient.disconnect(this.deviceId);
    }
    this.onDisconnect();
  }
}
