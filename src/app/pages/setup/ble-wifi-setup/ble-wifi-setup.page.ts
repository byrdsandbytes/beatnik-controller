import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { firstValueFrom, Observable } from 'rxjs';
import {
  BeatnikBlenoService,
  BleNetwork,
  WifiStatus,
} from 'src/app/services/beatnik-bleno.service';
import Swiper, { SwiperOptions } from 'swiper';

@Component({
  selector: 'app-ble-wifi-setup',
  templateUrl: './ble-wifi-setup.page.html',
  styleUrls: ['./ble-wifi-setup.page.scss'],
  standalone: false,
})
export class BleWifiSetupPage implements OnInit {
  isScanning: boolean = false;
  isWifiVerifying: boolean = false;
  isNetworkSetupComplete: boolean = false;
  deviceConnectionStatus$: Observable<
    'Disconnected' | 'Scanning' | 'Connecting' | 'Connected'
  > = this.beatikBlenoService.deviceConnectionStatus$;
  wifiConnectionStatus: Observable<WifiStatus> =
    this.beatikBlenoService.wifiStatus$;
  availableNetworks$: Observable<BleNetwork[]> =
    this.beatikBlenoService.availableNetworks$;

  public statusText: string = 'Waiting for user to start scan.';

  swiperConfig: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 0,
    allowTouchMove: false,
  };

  selectedNetwork: BleNetwork | null = null;
  networkPassword: string = '';
  passwordVisible: boolean = false;

  private swiperInstance: Swiper | undefined;
  public slideIndex: number = 0;

  constructor(
    private beatikBlenoService: BeatnikBlenoService,
    private router: Router,
    private navCtrl: NavController
  ) {}

  ngOnInit() {}

  async scanForServices() {
    this.isScanning = true;
    this.statusText = 'Scanning for Beatnik devices...';
    const result = await this.beatikBlenoService.findAndConnectWithouhtDialog();
    console.log('Scan result:', result);
    this.subsribeToDeviceConnectionStatus();
  }

  stopScan() {
    this.isScanning = false;
  }

  subsribeToDeviceConnectionStatus() {
    this.deviceConnectionStatus$.subscribe((status) => {
      console.log('Device connection status:', status);
      // delay to allow UI to update
      if (status === 'Scanning') {
        this.statusText = 'Scanning for Beatnik devices...';
      } else if (status === 'Connecting') {
        this.statusText = 'Connecting to Beatnik device...';
      } else if (status === 'Connected') {
        this.statusText = 'Connected to Beatnik device.';
        // delay to allow UI to update
        setTimeout(() => {
          this.subscribeToAvailableNetworks();
        }, 1000);
      } else {
        this.statusText = 'Disconnected. Please start scan again.';
      }
    });
  }

  subscribeToAvailableNetworks() {
    this.statusText = 'Searching for available Wi-Fi networks...';
    // delay to allow UI to update
    setTimeout(() => {
      this.availableNetworks$.subscribe((networks) => {
        console.log('Available networks:', networks);
        if (networks.length > 0) {
          this.statusText = `Found ${networks.length} Wi-Fi networks. Please select one to connect.`;
        } else {
          this.statusText = 'No Wi-Fi networks found. Please try again.';
        }
        this.isScanning = false;
        this.slideTo(1);
      });
    }, 2000);
  }

  onSlideChange(event: any) {
    console.log('slide change');
  }

  onSwiper(swiper: any) {
    console.log('swiper instance captured');
    this.swiperInstance = swiper;
    this.slideIndex = this.swiperInstance?.activeIndex || 0;
  }

  async slideNext() {
    this.swiperInstance?.slideNext();
    this.slideIndex = this.swiperInstance?.activeIndex || 0;
  }

  async slideTo(index: number) {
    this.swiperInstance?.slideTo(index);
    this.slideIndex = this.swiperInstance?.activeIndex || 0;
  }

  slidePrev() {
    this.swiperInstance?.slidePrev();
    this.slideIndex = this.swiperInstance?.activeIndex || 0;
  }

  async provisionWifi() {
    if (!this.selectedNetwork) {
      console.error('No network selected');
      return;
    }
    this.statusText = `Provisioning Wi-Fi network ${this.selectedNetwork.ssid}...`;
    await this.beatikBlenoService.provisionWifi(
      this.selectedNetwork.ssid,
      this.networkPassword
    );
    this.statusText = `Wi-Fi network ${this.selectedNetwork.ssid} provisioned. Please wait for connection status.`;
    this.slideTo(3);
    this.isWifiVerifying = true;
    this.subscribeToWifiStatus();
  }

  async subscribeToWifiStatus() {
    this.wifiConnectionStatus.subscribe((status) => {
      console.log('Wi-Fi connection status:', status);
      if (status.connected) {
        this.statusText = `Connected to Wi-Fi network. IP Address: ${status.ip}`;
        this.isWifiVerifying = false;
        this.isNetworkSetupComplete = true;
      } else if (status.message) {
        this.statusText = `Wi-Fi Status: ${status.message}`;
      } else {
        this.statusText = 'Verifying Wi-Fi connection...';
      }
    });
  }

  async completeSetup() {
    // Navigate to home and reset navigation stack
    // await this.router.navigate(['/tabs'], { replaceUrl: true });
    // navigate to server setup page and add IP address to url params
    const wifiConnectionStatus = await firstValueFrom(
      this.wifiConnectionStatus
    );
    const ip = wifiConnectionStatus.ip || '';
    await this.router.navigate([`/setup-server/${ip}`], { replaceUrl: true });
  }

  handleBack() {
    if (this.slideIndex > 0) {
      this.slidePrev();
    } else {
      this.navCtrl.navigateBack('/tabs');
    }
  }
}
