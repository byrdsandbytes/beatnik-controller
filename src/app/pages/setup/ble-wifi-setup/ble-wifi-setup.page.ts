import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonContent, NavController } from '@ionic/angular';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { BeatnikBlenoService, BleNetwork, WifiStatus } from 'src/app/services/beatnik-bleno.service';
import SwiperCore, { EffectFade, SwiperOptions } from 'swiper';
import Swiper from 'swiper';

SwiperCore.use([EffectFade]);
import { Network, ConnectionStatus } from '@capacitor/network';
import { PluginListenerHandle } from '@capacitor/core';


@Component({
  selector: 'app-ble-wifi-setup',
  templateUrl: './ble-wifi-setup.page.html',
  styleUrls: ['./ble-wifi-setup.page.scss'],
  standalone: false
})
export class BleWifiSetupPage implements OnInit, OnDestroy {

  @ViewChild(IonContent) private content?: IonContent;

  isScanning: boolean = false;
  isWifiVerifying: boolean = false;
  isNetworkSetupComplete: boolean = false;
  deviceConnectionStatus$: Observable<'Disconnected' | 'Scanning' | 'Connecting' | 'Connected'> = this.beatikBlenoService.deviceConnectionStatus$;
  wifiConnectionStatus: Observable<WifiStatus> = this.beatikBlenoService.wifiStatus$;
  availableNetworks$: Observable<BleNetwork[]> = this.beatikBlenoService.availableNetworks$;

  public statusText: string = 'Waiting for user to start scan.';

  swiperConfig: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 0,
    effect: 'fade',
    fadeEffect: { crossFade: true },
    speed: 350,
    allowTouchMove: false,
    // Keyboard, mouse wheel and nested scrolling must never move the wizard
    keyboard: false,
    mousewheel: false,
    simulateTouch: false,
    noSwiping: true
  };

  selectedNetwork: BleNetwork | null = null;
  manualSsid: string = '';
  isRescanning = false;
  networkPassword: string = '';
  passwordVisible: boolean = false;

  private swiperInstance: Swiper | undefined;
  public slideIndex: number = 0;

  smartphoneNetworkStatus: ConnectionStatus | null = null;

  private networkListener?: PluginListenerHandle;
  private deviceStatusSub?: Subscription;
  private networksSub?: Subscription;
  private wifiStatusSub?: Subscription;
  private rescanTimer?: ReturnType<typeof setTimeout>;
  private networksTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private beatikBlenoService: BeatnikBlenoService,
    private router: Router,
    private navCtrl: NavController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    this.smartphoneNetworkStatus = await Network.getStatus();
    console.log('Initial smartphone network status:', this.smartphoneNetworkStatus);
    this.networkListener = await Network.addListener('networkStatusChange', status => {
      this.smartphoneNetworkStatus = status;
    });
  }

  ngOnDestroy() {
    this.networkListener?.remove();
    this.deviceStatusSub?.unsubscribe();
    this.networksSub?.unsubscribe();
    this.wifiStatusSub?.unsubscribe();
    clearTimeout(this.networksTimer);
    clearTimeout(this.rescanTimer);
  }
  

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
    this.deviceStatusSub?.unsubscribe();
    this.deviceStatusSub = this.deviceConnectionStatus$.subscribe(status => {
      console.log('Device connection status:', status);
      // delay to allow UI to update
      if (status === 'Scanning') {
        this.statusText = 'Scanning for Beatnik devices...';
      } else if (status === 'Connecting') {
        this.statusText = 'Connecting to Beatnik device...';
      } else if (status === 'Connected') {
        this.statusText = 'Connected to Beatnik device.';
        // delay to allow UI to update
        clearTimeout(this.networksTimer);
        this.networksTimer = setTimeout(() => this.subscribeToAvailableNetworks(), 1000);
      } else {
        this.statusText = 'Disconnected. Please start scan again.';
      }
    });
  }

  subscribeToAvailableNetworks() {
    this.statusText = 'Searching for available Wi-Fi networks...';
    // delay to allow UI to update
    this.networksSub?.unsubscribe();
    clearTimeout(this.networksTimer);
    this.networksTimer = setTimeout(() => {
      this.networksSub = this.availableNetworks$.subscribe(networks => {
        console.log('Available networks:', networks);
        if (networks.length > 0) {
          this.statusText = `Found ${networks.length} Wi-Fi networks. Please select one to connect.`;
        } else {
          this.statusText = 'No Wi-Fi networks found. Please try again.';
        }
        this.isScanning = false;
        this.finishRescan();
        // Later list updates must not pull the user back from a further step
        if (this.slideIndex === 0) {
          this.slideTo(1);
        }
      });
    }, 2000);
  }

  get isManualNetwork(): boolean {
    return this.manualSsid.trim() !== '';
  }

  async rescanNetworks() {
    if (this.isRescanning) {
      return;
    }
    this.isRescanning = true;
    await this.beatikBlenoService.scanForWifiNetworks();
    // The list arrives via notifications; stop the spinner if nothing comes back
    clearTimeout(this.rescanTimer);
    this.rescanTimer = setTimeout(() => this.finishRescan(), 15000);
  }

  private finishRescan() {
    this.isRescanning = false;
    clearTimeout(this.rescanTimer);
  }

  // Lets the user connect to a network that isn't listed (e.g. a hidden SSID)
  async enterNetworkManually() {
    const alert = await this.alertController.create({
      header: 'Enter network manually',
      inputs: [{ name: 'ssid', type: 'text', placeholder: 'Network name (SSID)', value: this.manualSsid }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Continue',
          handler: (data) => {
            const ssid = (data?.ssid ?? '').trim();
            if (!ssid) {
              return false;
            }
            this.manualSsid = ssid;
            this.selectedNetwork = { ssid, quality: 0, security: 'unknown', band: 'unknown' };
            this.slideTo(2);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  onNetworkSelected() {
    this.manualSsid = '';
  }

  onSlideChange(event: any) {
    const swiper: Swiper | undefined = event?.[0] ?? this.swiperInstance;
    this.slideIndex = swiper?.activeIndex ?? 0;
    this.content?.scrollToTop(200);
  }

  onSwiper(swiper: any) {
    console.log('swiper instance captured');
    this.swiperInstance = swiper;
    this.slideIndex = this.swiperInstance?.activeIndex || 0;
  }

  async slideNext() {
    this.swiperInstance?.slideNext();
  }

  async slideTo(index: number) {
    this.swiperInstance?.slideTo(index);
  }

  slidePrev() {
    this.swiperInstance?.slidePrev();
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
    this.wifiStatusSub?.unsubscribe();
    this.wifiStatusSub = this.wifiConnectionStatus.subscribe(status => {
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
    const wifiConnectionStatus = await firstValueFrom(this.wifiConnectionStatus)
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
