# BLE Wi-Fi Provisioning Service Documentation

This document describes the Bluetooth Low Energy (BLE) GATT service for Wi-Fi provisioning. The service allows clients to:
1. Scan for available Wi-Fi networks
2. Send Wi-Fi credentials (SSID and password)
3. Trigger a connection attempt
4. Monitor the connection status

## 1. Service Specification

### 1.1 Service UUID
- Service UUID: `12345678-1234-5678-1234-56789abcdef0`

### 1.2 Characteristics

| Name | UUID | Properties | Description |
|------|------|------------|-------------|
| SSID | `12345678-1234-5678-1234-56789abcdef1` | Write, Write Without Response | Write the Wi-Fi SSID |
| Password | `12345678-1234-5678-1234-56789abcdef2` | Write, Write Without Response | Write the Wi-Fi password |
| Connect | `12345678-1234-5678-1234-56789abcdef3` | Write, Write Without Response | Trigger connection attempt |
| Status | `12345678-1234-5678-1234-56789abcdef4` | Read, Notify | Get connection status updates |
| Scan | `12345678-1234-5678-1234-56789abcdef5` | Read, Write, Notify | Trigger Wi-Fi scan and get results |

## 2. Workflow

### 2.1 Wi-Fi Network Discovery
1. Write any value to the Scan characteristic to trigger a Wi-Fi scan
2. Subscribe to notifications on the Scan characteristic
3. Receive scan results in the format: `SSID1|SIGNAL1|SECURITY1;SSID2|SIGNAL2|SECURITY2;...`
   - Each network is represented as `SSID|SIGNAL_STRENGTH|SECURITY_TYPE`
   - Networks are separated by semicolons (;)
   - Example: `MyWiFi|85|WPA2;GuestNet|70|Open`

### 2.2 Wi-Fi Provisioning
1. Write the chosen SSID to the SSID characteristic
2. Write the password to the Password characteristic
3. Write any value to the Connect characteristic to start the connection
4. Subscribe to the Status characteristic for progress updates

### 2.3 Status Updates
The Status characteristic provides real-time feedback:
- "Ready" - Initial state
- "Connecting to [SSID]..." - Connection attempt in progress
- "Success! Connected." - Successfully connected
- "Failed: [Reason]" - Connection failed with reason

## 3. Client Implementation Example (Angular with Capacitor)

### 3.1 Prerequisites
```bash
npm install @capacitor-community/bluetooth-le
npx cap sync
```

### 3.2 BLE Service Implementation

```typescript
import { Injectable, NgZone } from '@angular/core';
import { BleClient, BleDevice, numbersToDataView } from '@capacitor-community/bluetooth-le';
import { BehaviorSubject, Observable } from 'rxjs';

// Service & Characteristic UUIDs
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

  public status$ = this.statusSubject.asObservable();
  public networks$ = this.networksSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  async scanAndConnect(): Promise<void> {
    try {
      await BleClient.initialize();

      this.updateStatus('Scanning...');
      const device = await BleClient.requestDevice({
        services: [PROVISIONING_SERVICE]
      });

      this.updateStatus('Connecting...');
      await BleClient.connect(device.deviceId, (deviceId) => this.onDisconnect(deviceId));
      this.connectedDevice = device;

      // Subscribe to status updates
      await BleClient.startNotifications(
        device.deviceId,
        PROVISIONING_SERVICE,
        STATUS_CHARACTERISTIC,
        (value) => {
          const status = new TextDecoder().decode(value);
          this.updateStatus(status);
        }
      );

      // Subscribe to scan results
      await BleClient.startNotifications(
        device.deviceId,
        PROVISIONING_SERVICE,
        SCAN_CHARACTERISTIC,
        (value) => {
          const results = new TextDecoder().decode(value);
          this.parseAndUpdateNetworks(results);
        }
      );

    } catch (error) {
      console.error('Error:', error);
      this.updateStatus(`Error: ${error.message}`);
    }
  }

  async scanNetworks(): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('Not connected');
    }

    // Write any value to trigger scan
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      SCAN_CHARACTERISTIC,
      numbersToDataView([1])
    );
  }

  async provision(ssid: string, password: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('Not connected');
    }

    // Write SSID
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      SSID_CHARACTERISTIC,
      this.stringToDataView(ssid)
    );

    // Write Password
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      PASS_CHARACTERISTIC,
      this.stringToDataView(password)
    );

    // Trigger connection
    await BleClient.write(
      this.connectedDevice.deviceId,
      PROVISIONING_SERVICE,
      CONNECT_CHARACTERISTIC,
      numbersToDataView([1])
    );
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

  private stringToDataView(str: string): DataView {
    const encoder = new TextEncoder();
    return new DataView(encoder.encode(str).buffer);
  }

  private updateStatus(status: string): void {
    this.ngZone.run(() => {
      this.statusSubject.next(status);
    });
  }
}

### 3.3 Component Implementation

```typescript
@Component({
  selector: 'app-wifi-provisioning',
  template: `
    <ion-content class="ion-padding">
      <ion-button expand="block" (click)="connect()" 
                  [disabled]="(service.status$ | async) !== 'Disconnected'">
        Connect to Device
      </ion-button>

      <ion-button expand="block" (click)="scanNetworks()"
                  [disabled]="(service.status$ | async) === 'Disconnected'">
        Scan Networks
      </ion-button>

      <ion-list>
        <ion-item *ngFor="let network of service.networks$ | async"
                  (click)="selectNetwork(network)">
          <ion-label>
            <h2>{{network.ssid}}</h2>
            <p>Signal: {{network.signalStrength}}%, Security: {{network.security}}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div *ngIf="selectedNetwork">
        <ion-item>
          <ion-label position="stacked">Password for {{selectedNetwork.ssid}}</ion-label>
          <ion-input type="password" [(ngModel)]="password"></ion-input>
        </ion-item>
        <ion-button expand="block" (click)="provision()">
          Connect
        </ion-button>
      </div>

      <div class="status">
        Status: {{service.status$ | async}}
      </div>
    </ion-content>
  `
})
export class WifiProvisioningComponent {
  selectedNetwork?: WifiNetwork;
  password = '';

  constructor(public service: BleWifiProvisioningService) {}

  async connect(): Promise<void> {
    await this.service.scanAndConnect();
  }

  async scanNetworks(): Promise<void> {
    await this.service.scanNetworks();
  }

  async selectNetwork(network: WifiNetwork): Promise<void> {
    this.selectedNetwork = network;
  }

  async provision(): Promise<void> {
    if (!this.selectedNetwork) return;
    await this.service.provision(this.selectedNetwork.ssid, this.password);
  }
}
```

## 4. Server Requirements

The server implementation requires:
- Linux system with BlueZ 5.50+
- NetworkManager for Wi-Fi operations
- Python 3.7+ with the following packages:
  - dbus-next
  - asyncio

The server advertises as "beatnik-server" and automatically handles:
- BLE advertising and connection management
- Wi-Fi network scanning using NetworkManager
- Wi-Fi connection attempts
- Real-time status updates

## 5. Security Considerations

1. The service does not implement encryption beyond what BLE provides
2. Wi-Fi passwords are transmitted in plaintext over BLE
3. Consider implementing additional security measures for production use:
   - Require pairing/bonding
   - Implement application-layer encryption
   - Add authentication mechanisms

from dbus_next.service import ServiceInterface, method, signal, dbus_property
from dbus_next.aio import MessageBus
from dbus_next.constants import PropertyAccess
from dbus_next import BusType, Variant

# --- Configuration ---
# These are the standard D-Bus paths and interfaces for BlueZ
BLUEZ_SERVICE = "org.bluez"
GATT_MANAGER_IFACE = "org.bluez.GattManager1"
LE_ADVERTISING_MANAGER_IFACE = "org.bluez.LEAdvertisingManager1"
AGENT_MANAGER_IFACE = "org.bluez.AgentManager1"
DBUS_OM_IFACE = "org.freedesktop.DBus.ObjectManager"
DBUS_PROP_IFACE = "org.freedesktop.DBus.Properties"

# --- Our Custom Application ---
# We define our own object paths for our app, service, and characteristics
# This is just a unique name on D-Bus, like a folder path.
APP_PATH = "/org/example/provisioning"
SERVICE_PATH = f"{APP_PATH}/service1"

# Generate your own UUIDs!
SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0"
SSID_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef1"
PASS_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef2"
CONNECT_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef3"
STATUS_CHAR_UUID = "12345678-1234-5678-1234-56789abcdef4"

# We'll store our data in these global-like variables
class ProvisioningData:
    ssid = b""
    password = b""
    status = b"Ready"

data = ProvisioningData()
status_char_instance = None # Global instance for status updates

# --- Helper: Wi-Fi Connection Logic ---

def update_status(message_str):
    """Updates the status and prepares it for D-Bus."""
    if status_char_instance:
        status_char_instance.update_status(message_str)

def attempt_connection():
    """Uses nmcli to connect to the Wi-Fi network."""
    ssid = data.ssid.decode("utf-8")
    password = data.password.decode("utf-8")

    if not ssid:
        update_status("Error: No SSID")
        return

    logging.info(f"Attempting connection to SSID: {ssid}")
    update_status(f"Connecting to {ssid}...")

    try:
        cmd = ["nmcli", "device", "wifi", "connect", ssid, "password", password]
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if process.returncode == 0:
            update_status("Success! Connected.")
            logging.info("Successfully connected!")
            # In a real app, you might stop advertising here
        else:
            error_msg = "Failed: Bad Password?"
            if "Error: No network with SSID" in process.stderr:
                error_msg = "Failed: SSID Not Found"
            logging.error(f"Failed to connect: {process.stderr}")
            update_status(error_msg)

    except subprocess.TimeoutExpired:
        update_status("Failed: Timeout")
    except Exception as e:
        update_status(f"Failed: {str(e)}")


# --- D-Bus GATT Interface Classes ---
# This is the boilerplate to make our Python classes look like
# standard BlueZ GATT services and characteristics.

class BaseGATTCharacteristic(ServiceInterface):
    """Base class for our characteristics."""
    IFACE = "org.bluez.GattCharacteristic1"
    _char_counter = 0  # Class variable to track characteristic count

    def __init__(self, service_path, uuid, flags, description):
        super().__init__(self.IFACE)
        BaseGATTCharacteristic._char_counter += 1
        self.path = f"{service_path}/char{BaseGATTCharacteristic._char_counter}"
        self._uuid = uuid
        self._flags = flags
        self._description = description
        self.service = service_path
        
    @method()
    def ReadValue(self, options: "a{sv}") -> "ay":  # 'ay' means 'array of bytes'
        """Default ReadValue method."""
        logging.warning(f"ReadValue called on non-readable char: {self._uuid}")
        return []

    @method()
    def WriteValue(self, value: "ay", options: "a{sv}"):
        """Default WriteValue method."""
        logging.warning(f"WriteValue called on non-writable char: {self._uuid}")

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":  # 's' means 'string'
        return self._uuid

    @dbus_property(access=PropertyAccess.READ)
    def Service(self) -> "o":  # 'o' means 'object path'
        return self.service

    @dbus_property(access=PropertyAccess.READ)
    def Flags(self) -> "as":  # 'as' means 'array of strings'
        return self._flags
        
    def add_descriptor(self, bus):
        """Adds the 'User Description' descriptor."""
        desc = Descriptor(
            bus=bus,
            index=0,
            uuid="2901",
            flags=["read"],
            characteristic=self,
            value=self._description.encode("utf-8")
        )
        bus.export(desc.path, desc)
        return desc.path

class Descriptor(ServiceInterface):
    """
    A simple GATT Descriptor implementation.
    """
    IFACE = "org.bluez.GattDescriptor1"

    def __init__(self, bus, index, uuid, flags, characteristic, value):
        self.path = f"{characteristic.path}/desc{index}"
        super().__init__(self.IFACE)
        self.bus = bus
        self._uuid = f"0000{uuid}-0000-1000-8000-00805f9b34fb"
        self._flags = flags
        self.characteristic = characteristic
        self._value = value

    @method()
    def ReadValue(self, options: "a{sv}") -> "ay":
        return list(self._value)

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return self._uuid

    @dbus_property(access=PropertyAccess.READ)
    def Characteristic(self) -> "o":
        return self.characteristic.path

    @dbus_property(access=PropertyAccess.READ)
    def Flags(self) -> "as":
        return self._flags

class SSIDCharacteristic(BaseGATTCharacteristic):
    def __init__(self, service_path):
        super().__init__(
            service_path,
            SSID_CHAR_UUID,
            ["write", "write-without-response"],
            "Wi-Fi SSID"
        )

    @method()
    def WriteValue(self, value: "ay", options: "a{sv}"):
        logging.info(f"WriteValue called with options: {options}")
        logging.info(f"SSID set to: {bytes(value).decode('utf-8', errors='replace')}")
        data.ssid = bytes(value)

class PasswordCharacteristic(BaseGATTCharacteristic):
    def __init__(self, service_path):
        super().__init__(
            service_path,
            PASS_CHAR_UUID,
            ["write", "write-without-response"],
            "Wi-Fi Password"
        )

    @method()
    def WriteValue(self, value: "ay", options: "a{sv}"):
        # Don't log the password!
        logging.info("Password set.")
        data.password = bytes(value)

class ConnectCharacteristic(BaseGATTCharacteristic):
    def __init__(self, service_path):
        super().__init__(
            service_path,
            CONNECT_CHAR_UUID,
            ["write", "write-without-response"],
            "Trigger Connection"
        )

    @method()
    def WriteValue(self, value: "ay", options: "a{sv}"):
        logging.info("Connect characteristic written to. Starting connection...")
        # Run connection logic in the background, don't block D-Bus
        asyncio.create_task(
            asyncio.to_thread(attempt_connection)
        )

class StatusCharacteristic(BaseGATTCharacteristic):
    def __init__(self, service_path):
        super().__init__(
            service_path,
            STATUS_CHAR_UUID,
            ["read", "notify"],
            "Connection Status"
        )
        self.value = b"Ready"

    def update_status(self, message_str):
        """Updates the status and notifies subscribers."""
        logging.info(f"Updating status: {message_str}")
        self.value = message_str.encode("utf-8")
        self.emit_properties_changed({"Value": self.value})

    @method()
    def ReadValue(self, options: "a{sv}") -> "ay":
        logging.info(f"Status read: {self.value.decode('utf-8', errors='replace')}")
        return list(self.value)

# This class will hold all our characteristics
class ProvisioningService(ServiceInterface):
    IFACE = "org.bluez.GattService1"

    def __init__(self):
        super().__init__(self.IFACE)
        self.path = SERVICE_PATH
        self._uuid = SERVICE_UUID
        self._primary = True
        self.characteristics = []

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return self._uuid

    @dbus_property(access=PropertyAccess.READ)
    def Primary(self) -> "b":
        return self._primary

    def add_characteristic(self, char):
        self.characteristics.append(char)

    def get_paths(self):
        """Gets all D-Bus paths for this service and its children."""
        paths = {self.path: [self.IFACE]}
        for char in self.characteristics:
            paths[char.path] = [char.IFACE, "org.freedesktop.DBus.Properties"]
            # Add descriptor path
            paths[f"{char.path}/desc0"] = [Descriptor.IFACE, "org.freedesktop.DBus.Properties"]
        return paths

    def get_properties(self):
        """Gets all D-Bus properties for this service."""
        return {
            self.IFACE: {
                "UUID": self._uuid,
                "Primary": self._primary,
                # This tells BlueZ which characteristics belong to this service
                "Characteristics": [char.path for char in self.characteristics],
            }
        }

# This class defines our BLE Advertisement
class Advertisement(ServiceInterface):
    IFACE = "org.bluez.LEAdvertisement1"

    def __init__(self):
        super().__init__(self.IFACE)
        self.path = "/org/example/advertisement1"
        self.ad_type = "peripheral"
        self.local_name = "Pi-Provisioner"
        self.service_uuids = [SERVICE_UUID]
        self.include_tx_power = True
        # iOS-friendly settings
        self.discoverable = True
        self.appearance = 0x0000  # Unknown appearance

    @method()
    def Release(self):
        logging.info("Advertisement released.")

    def get_properties(self):
        props = {
            self.IFACE: {
                "Type": self.ad_type,
                "ServiceUUIDs": self.service_uuids,
                "LocalName": self.local_name,
                "IncludeTxPower": self.include_tx_power,
                "Discoverable": self.discoverable,
            }
        }
        return props


# --- Simple Auto-Accept Agent ---

class SimpleAgent(ServiceInterface):
    """
    A minimal agent that auto-accepts everything.
    """
    IFACE = "org.bluez.Agent1"
    
    def __init__(self):
        super().__init__(self.IFACE)
        self.path = "/org/example/agent"
    
    @method()
    def Release(self):
        logging.info("Agent released")
    
    @method()
    def RequestPinCode(self, device: "o") -> "s":
        logging.info(f"Auto-accepting pin request for {device}")
        return "0000"
    
    @method()
    def DisplayPinCode(self, device: "o", pincode: "s"):
        logging.info(f"Display pin: {pincode}")
    
    @method()
    def RequestPasskey(self, device: "o") -> "u":
        logging.info(f"Auto-accepting passkey request for {device}")
        return 0
    
    @method()
    def DisplayPasskey(self, device: "o", passkey: "u", entered: "q"):
        logging.info(f"Display passkey: {passkey}")
    
    @method()
    def RequestConfirmation(self, device: "o", passkey: "u"):
        logging.info(f"Auto-confirming {passkey} for {device}")
        # Just return - no exception means accept
        return
    
    @method()
    def RequestAuthorization(self, device: "o"):
        logging.info(f"Auto-authorizing {device}")
        return
    
    @method()
    def AuthorizeService(self, device: "o", uuid: "s"):
        logging.info(f"Auto-authorizing service {uuid} for {device}")
        return
    
    @method()
    def Cancel(self):
        logging.info("Pairing canceled")


# --- Main Application Logic ---

async def main():
    logging.basicConfig(level=logging.INFO)
    global status_char_instance

    # Connect to the D-Bus system bus (where BlueZ lives)
    bus = await MessageBus(bus_type=BusType.SYSTEM).connect()

    # --- 1. Define Service and Characteristics ---
    service = ProvisioningService()
    
    # Add characteristics to the service
    service.add_characteristic(SSIDCharacteristic(service.path))
    service.add_characteristic(PasswordCharacteristic(service.path))
    service.add_characteristic(ConnectCharacteristic(service.path))
    status_char_instance = StatusCharacteristic(service.path)
    service.add_characteristic(status_char_instance)

    # --- 2. Publish everything on D-Bus ---
    # This makes our Python objects visible to other programs (like BlueZ)
    bus.export(service.path, service)
    for char in service.characteristics:
        bus.export(char.path, char)
        char.add_descriptor(bus)

    # We must also publish all our objects under the DBus.ObjectManager
    # This is how BlueZ discovers all the paths at once
    class ApplicationObjectManager(ServiceInterface):
        def __init__(self, service):
            super().__init__(DBUS_OM_IFACE)
            self.service = service
        
        @method()
        def GetManagedObjects(self) -> "a{oa{sa{sv}}}":
            return self.service.get_paths()
    
    obj_manager = ApplicationObjectManager(service)
    bus.export(APP_PATH, obj_manager)

    # --- 3. Find the Bluetooth adapter ---
    # First, get the ObjectManager to discover available adapters
    try:
        introspection = await bus.introspect(BLUEZ_SERVICE, "/")
    except Exception as e:
        logging.error(f"Failed to introspect BlueZ service. Is bluetoothd running? Error: {e}")
        logging.error("Try: sudo systemctl start bluetooth")
        return
    
    obj = bus.get_proxy_object(BLUEZ_SERVICE, "/", introspection)
    obj_manager = obj.get_interface(DBUS_OM_IFACE)
    objects = await obj_manager.call_get_managed_objects()
    
    adapter_path = None
    for path, interfaces in objects.items():
        if GATT_MANAGER_IFACE in interfaces:
            adapter_path = path
            break
    
    if not adapter_path:
        logging.error("No Bluetooth adapter with GATT support found")
        return
    
    logging.info(f"Using Bluetooth adapter: {adapter_path}")
    
    # --- 4. Power on and configure the adapter ---
    adapter_introspection = await bus.introspect(BLUEZ_SERVICE, adapter_path)
    adapter_obj = bus.get_proxy_object(BLUEZ_SERVICE, adapter_path, adapter_introspection)
    
    # Make sure the adapter is powered on and discoverable
    adapter_props = adapter_obj.get_interface(DBUS_PROP_IFACE)
    await adapter_props.call_set("org.bluez.Adapter1", "Powered", Variant("b", True))
    logging.info("Adapter powered on")
    
    # Enable discoverable mode for BLE advertising (iOS requires this)
    await adapter_props.call_set("org.bluez.Adapter1", "Discoverable", Variant("b", True))
    await adapter_props.call_set("org.bluez.Adapter1", "DiscoverableTimeout", Variant("u", 0))
    logging.info("Adapter set to always discoverable")
    
    # Disable pairing completely - iOS will connect without bonding
    await adapter_props.call_set("org.bluez.Adapter1", "Pairable", Variant("b", False))
    logging.info("Pairing disabled - iOS connects without bonding")
    
    gatt_manager = adapter_obj.get_interface(GATT_MANAGER_IFACE)
    
    try:
        await gatt_manager.call_register_application(APP_PATH, {})
        logging.info("GATT application registered successfully.")
    except Exception as e:
        logging.error(f"Failed to register GATT application: {e}")
        return

    # --- 6. Register our Advertisement with BlueZ ---
    ad_manager = adapter_obj.get_interface(LE_ADVERTISING_MANAGER_IFACE)
    advertisement = Advertisement()    
    bus.export(advertisement.path, advertisement)
    
    try:
        await ad_manager.call_register_advertisement(advertisement.path, {})
        logging.info(f"Advertising as '{advertisement.local_name}'...")
    except Exception as e:
        logging.error(f"Failed to register advertisement: {e}")
        return

    # --- 5. Run forever ---
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        logging.info("Unregistering application and advertisement...")
        try:
            await gatt_manager.call_unregister_application(APP_PATH)
            await ad_manager.call_unregister_advertisement(advertisement.path)
        except:
            pass
        bus.unexport(advertisement.path)
        bus.unexport(APP_PATH)
        bus.disconnect()
        logging.info("Done.")


if __name__ == "__main__":
    asyncio.run(main())

---

## 6. Client Implementation Example (Angular with Capacitor)

This tutorial demonstrates how to build a client application in Angular to interact with the BLE provisioning service. We will use the `@capacitor-community/bluetooth-le` plugin to handle the BLE communication.

### 6.1. Prerequisites

- An existing Angular project with Capacitor set up.
- The Capacitor Bluetooth LE plugin installed:
  ```bash
  npm install @capacitor-community/bluetooth-le
  npx cap sync
  ```
- Basic knowledge of Angular services and RxJS.

### 6.2. Step 1: Create a BLE Provisioning Service

First, create a dedicated Angular service to encapsulate all the BLE logic. This keeps your components clean and your BLE code reusable.

**`src/app/services/ble-provisioning.service.ts`**
```typescript
import { Injectable, NgZone } from '@angular/core';
import { BleClient, BleDevice, numbersToDataView, stringToDataView } from '@capacitor-community/bluetooth-le';
import { BehaviorSubject, Observable } from 'rxjs';

// Use the UUIDs from your Python script
const PROVISIONING_SERVICE = '12345678-1234-5678-1234-56789abcdef0';
const SSID_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef1';
const PASS_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef2';
const CONNECT_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef3';
const STATUS_CHARACTERISTIC = '12345678-1234-5678-1234-56789abcdef4';

@Injectable({
  providedIn: 'root'
})
export class BleProvisioningService {
  private connectedDevice: BleDevice | undefined;
  private statusSubject = new BehaviorSubject<string>('Disconnected');
  public status$: Observable<string> = this.statusSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  async scanAndConnect(): Promise<void> {
    try {
      await BleClient.initialize();

      this.updateStatus('Scanning...');
      const device = await BleClient.requestDevice({
        services: [PROVISIONING_SERVICE],
        name: 'Pi-Provisioner',
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
          const status = new TextDecoder().decode(value);
          this.updateStatus(status);
        }
      );

    } catch (error) {
      console.error('Scan or connect error:', error);
      this.updateStatus(`Error: ${error.message}`);
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
}
```

### 6.3. Step 2: Create a UI Component

Now, create a component that uses this service to provide a user interface for provisioning.

**`src/app/pages/provisioning/provisioning.page.html`**
```html
<ion-header>
  <ion-toolbar>
    <ion-title>Wi-Fi Provisioning</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <div class="status-banner">
    <strong>Status:</strong> {{ bleService.status$ | async }}
  </div>

  <ion-button expand="block" (click)="scan()" [disabled]="(bleService.status$ | async) !== 'Disconnected'">
    Scan & Connect
  </ion-button>

  <div *ngIf="(bleService.status$ | async) !== 'Disconnected'">
    <ion-list>
      <ion-item>
        <ion-label position="floating">Wi-Fi SSID</ion-label>
        <ion-input type="text" [(ngModel)]="ssid"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Password</ion-label>
        <ion-input type="password" [(ngModel)]="password"></ion-input>
      </ion-item>
    </ion-list>

    <ion-button expand="block" (click)="startProvisioning()" [disabled]="!ssid">
      Provision Device
    </ion-button>

    <ion-button expand="block" color="danger" (click)="disconnect()">
      Disconnect
    </ion-button>
  </div>
</ion-content>
```

**`src/app/pages/provisioning/provisioning.page.ts`**
```typescript
import { Component } from '@angular/core';
import { BleProvisioningService } from 'src/app/services/ble-provisioning.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-provisioning',
  templateUrl: './provisioning.page.html',
})
export class ProvisioningPage {
  ssid = '';
  password = '';

  constructor(
    public bleService: BleProvisioningService,
    private alertCtrl: AlertController
  ) {}

  async scan(): Promise<void> {
    await this.bleService.scanAndConnect();
  }

  async startProvisioning(): Promise<void> {
    try {
      await this.bleService.provision(this.ssid, this.password);
    } catch (error) {
      this.showAlert('Error', error.message);
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
}
```

### 6.4. How It Works

1.  **`BleProvisioningService`**:
    -   **`scanAndConnect()`**: This method initiates the BLE scan, filtering for devices that advertise the correct service UUID. Once a device is found and selected by the user, it connects and immediately subscribes to the `STATUS_CHARACTERISTIC`.
    -   **`provision()`**: Takes the SSID and password, converts them to the required format (`DataView`), and writes them to the `SSID_CHARACTERISTIC` and `PASS_CHARACTERISTIC`. Finally, it writes to the `CONNECT_CHARACTERISTIC` to start the process on the device.
    -   **`status$`**: An RxJS `BehaviorSubject` is used to hold the latest status message. The component subscribes to this observable to display real-time feedback.
    -   **`NgZone`**: Callbacks from the BLE plugin run outside of Angular's change detection zone. We inject `NgZone` and use `ngZone.run()` to ensure that status updates are reflected in the UI.

2.  **`ProvisioningPage`**:
    -   The component's template binds to the `status$` observable from the service to show the current status.
    -   It provides input fields for the SSID and password.
    -   Buttons call the corresponding methods in the `BleProvisioningService` to scan, provision, and disconnect.
    -   UI elements are enabled or disabled based on the connection status to guide the user through the process.
```