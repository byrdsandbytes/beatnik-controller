import { Component, OnInit } from '@angular/core';
import { ZeroconfService } from 'src/app/services/zero-conf.service';
import { ZeroConf, ZeroConfService as ZeroConfServiceModel } from 'capacitor-zeroconf';
import { firstValueFrom, Observable } from 'rxjs';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { ServerDetail, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { ActivatedRoute, Router } from '@angular/router';
import Swiper, { SwiperOptions } from 'swiper';
import { AlertController, NavController } from '@ionic/angular';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';
import { BeatnikHardware } from 'src/app/model/beatnik-hardware.model';
import { SUPPORTED_HATS } from 'src/app/constant/hat.constant';
import { BeatnikSnapcastService } from 'src/app/services/beatnik-snapcast.service';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from 'src/app/enum/user-preference.enum';


@Component({
  selector: 'app-setup-server',
  templateUrl: './setup-server.page.html',
  styleUrls: ['./setup-server.page.scss'],
  standalone: false,
})
export class SetupServerPage implements OnInit {

  services$: Observable<ZeroConfServiceModel[]>;
  selectedService: ZeroConfServiceModel | null = null;
  readonly SERVICE_SNAPCAST = '_snapcast._tcp.';
  readonly SERVICE_BEATNIK = '_beatnik._tcp.';
  isScanning = false;
  state: 'initial' | 'scanning' | 'manual' | 'selected' | 'deviceFound' = 'initial';
  statusIcon: string = 'radio';
  snapcastServerStatus: Observable<SnapCastServerStatusResponse> | null = null;
  segment: string = 'server';

  ip: string | null = null;
  userPreferenceServerAdress: string = '';

  isFirstDevice: boolean = true;

  swiperConfig: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 0,
    allowTouchMove: false
  };

  statusText: string = 'Searching for Snapcast Servers...';
  hardwareStatus$: Observable<HardwareStatus>;

  private swiperInstance: Swiper | undefined;
  public slideIndex: number = 0;
  hats = Object.values(SUPPORTED_HATS);
  manualHatId: string = '';

  constructor(
    private zeroconf: ZeroconfService,
    private snapcastService: SnapcastService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private beatnikHardwareService: BeatnikHardwareService,
    private beatnikSnapcastService: BeatnikSnapcastService,
    private alertController: AlertController,
    private router: Router
  ) {
    this.services$ = this.zeroconf.services$;
  }

  async ngOnInit() {
    await this.getRouteIp();
    await this.getUserPreferencesServerName();
    this.services$.subscribe(services => {
      if (services.length > 0) {
        this.selectedService = services[0];
        // add timeout of 2 seconds before sliding to next slide
        setTimeout(() => {
          this.state = 'deviceFound';
          this.statusText = 'Snapcast Server found!';
          this.slideTo(1);
        }, 2000);
        // this.connectToSnapcast(services[0]);
        this.checkIfThereIsExistingSnapcastServer();

      }
    });
    this.scanForServices();
    this.snapcastServerStatus = this.snapcastService.state$;
  }

  getUserPreferencesServerName() {
    Preferences.get({ key: UserPreference.SERVER_URL }).then((result) => {
      this.userPreferenceServerAdress = result.value;
    });
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

  handleBack() {
    if (this.slideIndex > 0) {
      this.slidePrev();
    } else {
      this.navCtrl.navigateBack('/tabs');
    }
  }

  // get route param 
  async getRouteIp() {
    this.ip = this.activatedRoute.snapshot.paramMap.get('ip');
  }

  async checkIfThereIsExistingSnapcastServer() {
    try {
      const services = await firstValueFrom(this.services$);
      // check if there is only the service found with the current device's ip
      // if (services.length === 1) {
      //   this.isFirstDevice = true;
      // } else if (services.length > 1) {
      //   this.isFirstDevice = false;
      // } else {
      //   this.isFirstDevice = true;
      // }

      //  check if there is more than one snapcasrt service found
      const filteredServices = services.filter(service => service.type === this.SERVICE_SNAPCAST);
      if (filteredServices.length > 1) {
        console.log('Multiple Snapcast services found:', filteredServices);
        this.isFirstDevice = false;
      } else {
        this.isFirstDevice = true;
        console.log('Single Snapcast service found, proceeding with setup');
      }
    } catch (error) {
      console.error('Error checking for existing Snapcast server:', error);
    }
  }

  async scanForServices(): Promise<void> {
    this.isScanning = true;
    this.state = 'scanning';
    try {

      await this.zeroconf.watch(this.SERVICE_SNAPCAST);
      console.log(`Started scanning for services of type: ${this.SERVICE_SNAPCAST}`);
      await this.zeroconf.watch(this.SERVICE_BEATNIK);
      console.log(`Started scanning for services of type: ${this.SERVICE_BEATNIK}`);
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
    this.statusText = 'Connecting to Snapcast Server...';
    console.log('Connecting to Snapcast service:', service);
    console.log('hostname:', service.hostname);
    console.log('port:', service.port);
    // remove any trailing dot from the hostname
    if (service.hostname.endsWith('.')) {
      service.hostname = service.hostname.slice(0, -1);
    }

    try {
      await this.snapcastService.connect(service.ipv4Addresses[0], undefined, true);

      console.log('Connected to service:', service);
    } catch (error) {
      console.error('Error connecting to service:', error);
    }

    try {
      this.snapcastServerStatus = this.snapcastService.state$
      console.log('Fetching server status...');
      const status = await firstValueFrom(this.snapcastServerStatus);
      // set timeout of 2 seconds before changing state
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Server status:', status);
      this.state = 'selected';
      this.statusText = 'Connected to Snapcast Server.';
      this.statusIcon = 'checkmark-circle';
      this.isScanning = false;
    } catch (error) {
      console.error('Error fetching server status:', error);
    }
  }

  async setupAsSnapcastServer(): Promise<void> {
    console.log('Setting up this device as Snapcast server...');
    this.beatnikSnapcastService.enable(this.ip || '').subscribe({
      next: (response) => {
        this.setServerUrl();
        console.log('Successfully enabled Snapserver on server at IP', this.ip, response);
        this.connectToSnapcast(this.selectedService);
        this.navToSetupSoundcard();

      },
      error: (err) => {
        console.error('Failed to enable Snapserver on server at IP', this.ip, err);
      }
    });
  }

  setServerUrl() {
    Preferences.set({
      key: UserPreference.SERVER_URL,
      value: this.ip || '',
    }).then(() => {
      console.log('Server URL set to:', this.ip);
    });
  }

  async setupAsSecondaryServer(): Promise<void> {
    console.log('Setting up this device as secondary Snapcast server...');
    this.beatnikSnapcastService.enable(this.ip || '').subscribe({
      next: (response) => {
        console.log('Successfully enabled Snapserver on server at IP', this.ip, response);
        this.slideTo(2);
      },
      error: (err) => {
        console.error('Failed to enable Snapserver on server at IP', this.ip, err);
      }
    });
  }

  async setupAsSnapcastClient(): Promise<void> {
    if (!this.ip) {
      console.error('No IP address provided for Snapcast server.');
      return;
    }
    console.log('Setting up this device as Snapcast client...');
    const result = this.beatnikSnapcastService.disable(this.ip).subscribe({
      next: (response) => {
        console.log('Successfully disabled Snapserver on server at IP', this.ip, response);
        this.navToSetupSoundcard();
      },
      error: (err) => {
        console.error('Failed to disable Snapserver on server at IP', this.ip, err);
      }
    });
  }

  async finishServerSetup(): Promise<void> {
    console.log('Finishing server setup...');
    // this.getHardwareInfo();
    this.navToSetupSoundcard();
  }

  getHardwareInfo() {
    // if (!this.client) {
    //   console.error('ClientDetailsPage: No client available to get hardware info');
    //   return;
    // }
    // const localHostName = this.client.host.name + '.local';
    this.hardwareStatus$ = this.beatnikHardwareService.getStatus(this.ip);
  }

  applyManualHatConfig() {
    if (!this.manualHatId) {
      console.error('No manual HAT ID provided');
      return;
    }
    console.log(`Applying manual hardware configuration ${this.manualHatId} to server at IP ${this.ip}`);
    this.beatnikHardwareService.applyConfiguration(this.manualHatId, this.ip || '').subscribe({
      next: (response) => {
        console.log(`Successfully applied manual hardware configuration ${this.manualHatId} to server at IP ${this.ip}`, response);
        if (response.rebootRequired) {
          console.log('Reboot required. Triggering reboot...');
          this.beatnikHardwareService.reboot(this.ip || '').subscribe({
            next: () => {
              console.log(`Successfully triggered reboot for server at IP ${this.ip}`);
            },
            error: (err) => {
              console.error(`Failed to trigger reboot for server at IP ${this.ip}`, err);
            }
          });
        }
      },
      error: (err) => {
        console.error(`Failed to apply manual hardware configuration ${this.manualHatId} to server at IP ${this.ip}`, err);
      }
    });
  }

  async showSnapcastDoubleServerWarning() {
    const alert = await this.alertController.create({
      header: 'Existing Snapcast Server Detected',
      message: 'Another Snapcast server was detected on the network. Setting up multiple servers may cause conflicts. Are you sure you want to set up this device as a secondary server?',
      buttons: [
        {
          text: 'Yes, Setup as Server',
          handler: () => {
            this.setupAsSecondaryServer();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {

          }
        }
      ]
    });

    await alert.present();
  }

  navToSetupSoundcard() {
    this.router.navigateByUrl(`/setup-soundcard/${this.ip}`);
  }


}
