import { Component, OnInit } from '@angular/core';
// import { ZeroconfService } from 'src/app/services/zero-conf.service';
// import { ZeroConf, ZeroConfService as ZeroConfServiceModel } from 'capacitor-zeroconf';
import { firstValueFrom, Observable } from 'rxjs';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { ServerDetail, SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { ActivatedRoute, Router } from '@angular/router';
import Swiper, { SwiperOptions } from 'swiper';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { BeatnikHardwareService, HardwareStatus } from 'src/app/services/beatnik-hardware.service';
import { BeatnikHardware } from 'src/app/model/beatnik-hardware.model';
import { SUPPORTED_HATS } from 'src/app/constant/hat.constant';
import { BeatnikSnapcastService } from 'src/app/services/beatnik-snapcast.service';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from 'src/app/enum/user-preference.enum';
import { MdnsDiscoverResult, MdnsService } from '@byrds/capacitor-mdns';
import { CapMdnsService } from 'src/app/services/cap-mdns.service';


@Component({
  selector: 'app-setup-server',
  templateUrl: './setup-server.page.html',
  styleUrls: ['./setup-server.page.scss'],
  standalone: false,
})
export class SetupServerPage implements OnInit {

  // services$: Observable<ZeroConfServiceModel[]>;
  beatnikmdnsResults: MdnsDiscoverResult;
  snapcastmdnsResults: MdnsDiscoverResult;
  selectedService: MdnsService | null = null;
  readonly SERVICE_SNAPCAST = '_snapcast._tcp.';
  readonly SERVICE_BEATNIK = '_beatnik._tcp.';
  isScanning = false;
  state: 'initial' | 'scanning' | 'manual' | 'selected' | 'deviceFound' = 'initial';
  statusIcon: string = 'radio';
  snapcastServerStatus: Observable<SnapCastServerStatusResponse> | null = null;
  segment: string = 'server';

  ip: string | null = null;
  userPreferenceServerAdress: string = '';

  isFirstDevice: boolean = false;

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

  loadingDisplay: HTMLIonLoadingElement | null = null;

  constructor(
    // private zeroconf: ZeroconfService,
    private capMdnsService: CapMdnsService,
    private snapcastService: SnapcastService,
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private beatnikHardwareService: BeatnikHardwareService,
    private beatnikSnapcastService: BeatnikSnapcastService,
    private alertController: AlertController,
    private router: Router,
    private loadingController: LoadingController
  ) {
    // this.services$ = this.zeroconf.services$;
  }

  async ngOnInit() {
    await this.getRouteIp();
    await this.getUserPreferencesServerName();
    await this.scanForServices();
    
    if (this.snapcastmdnsResults && this.snapcastmdnsResults.services.length > 0) {
      this.selectedService = this.snapcastmdnsResults.services[0];
      // add timeout of 2 seconds before sliding to next slide
      setTimeout(() => {
        this.state = 'deviceFound';
        this.statusText = 'Snapcast Server found!';
        this.slideTo(1);
      }, 2000);
      this.checkIfThereIsExistingSnapcastServer();
    }
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
      const filteredServices = this.snapcastmdnsResults?.services || [];
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
      this.snapcastmdnsResults = await this.capMdnsService.discover({ type: this.SERVICE_SNAPCAST, timeout: 5000 });
      console.log('Discovered Snapcast services:', this.snapcastmdnsResults);
      this.beatnikmdnsResults = await this.capMdnsService.discover({ type: this.SERVICE_BEATNIK, timeout: 5000 });
      console.log('Discovered Beatnik services:', this.beatnikmdnsResults);
      this.isScanning = false;
    }
    catch (error) {
      console.error('Error starting service scan:', error);
      this.isScanning = false;
    }
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
  }

  async openManualEntry(): Promise<void> {
    // Logic to open a modal or navigate to a page for manual IP entry
    console.log('Manual IP entry not implemented yet.');
  }

  async selectService(service: MdnsService): Promise<void> {
    // Logic to handle the selected service, e.g., save its IP and port
    console.log('Selected service:', service);
  }

  async connectToSnapcast(service: MdnsService): Promise<void> {
    if(!service) return;
    this.statusText = 'Connecting to Snapcast Server...';
    console.log('Connecting to Snapcast service:', service);
    console.log('hostname:', service.hostname);
    console.log('port:', service.port);

    if (service.hostname?.endsWith('.')) {
      service.hostname = service.hostname.slice(0, -1);
    }

    try {
      await this.snapcastService.connect(service.hosts[0], undefined, true);

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
    this.showLoadingSpinner('Setting up this device as Snapcast server...');
    if (!this.ip) {
      console.error('No IP address provided for Snapcast server.');
      this.loadingDisplay?.dismiss();
      return;
    }

    console.log('Setting up this device as Snapcast server...');
    this.beatnikSnapcastService.enable(this.ip || '').subscribe({
      next: (response) => {
        this.setServerUrl();
        console.log('Successfully enabled Snapserver on server at IP', this.ip, response);
        this.connectToSnapcast(this.selectedService);
        this.navToSetupSoundcard();
        this.loadingDisplay?.dismiss();

      },
      error: (err) => {
        console.error('Failed to enable Snapserver on server at IP', this.ip, err);
        this.loadingDisplay?.dismiss(); 
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
    this.showLoadingSpinner('Setting up this device as secondary Snapcast server...');
    if (!this.ip) {
      console.error('No IP address provided for Snapcast server.');
      this.loadingDisplay?.dismiss();
      return;
    }
    console.log('Setting up this device as secondary Snapcast server...');
    this.beatnikSnapcastService.enable(this.ip || '').subscribe({
      next: (response) => {
        console.log('Successfully enabled Snapserver on server at IP', this.ip, response);
        this.slideTo(2);
        this.loadingDisplay?.dismiss();
      },
      error: (err) => {
        console.error('Failed to enable Snapserver on server at IP', this.ip, err);
        this.loadingDisplay?.dismiss();
      }
    });
  }

  async setupAsSnapcastClient(): Promise<void> {
    this.showLoadingSpinner('Setting up this device as Snapcast client...');
    if (!this.ip) {
      console.error('No IP address provided for Snapcast server.');
      return;
    }
    console.log('Setting up this device as Snapcast client...');
    const result = this.beatnikSnapcastService.disable(this.ip).subscribe({
      next: (response) => {
        console.log('Successfully disabled Snapserver on server at IP', this.ip, response);
        this.navToSetupSoundcard();
        this.loadingDisplay?.dismiss();
      },
      error: (err) => {
        console.error('Failed to disable Snapserver on server at IP', this.ip, err);
        this.loadingDisplay?.dismiss();
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

  async showLoadingSpinner(text: string) {

    this.loadingDisplay = await this.loadingController.create({
      message: text,
      spinner: 'dots',
      backdropDismiss: false,
    });
    await this.loadingDisplay.present();
  }


}
