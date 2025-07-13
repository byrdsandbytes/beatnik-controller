import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { first, firstValueFrom, Observable } from 'rxjs';
import { Group, ServerDetail, SnapCastServerStatusResponse, Stream } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { SwiperOptions } from 'swiper';
import { environment } from 'src/environments/environment';
import { omit } from 'lodash-es';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from 'src/app/enum/user-preference.enum';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {


  swiperConfig: SwiperOptions = {
    slidesPerView: 1.3,
    spaceBetween: 10,
  };

  displayState?: Observable<SnapCastServerStatusResponse | null>;

  today: Date = new Date();
  isLoading: boolean = true;
  environment = environment;
  userPreferenceServerUrl?: string;
  userPreeferenceUsername?: string;

  // public groups$: Observable<Group[]>;
  // public streams$: Observable<Stream[]>;
  // public serverDetails$: Observable<ServerDetail | undefined>;

  constructor(
    private snapcastService: SnapcastService,
  ) {
    // this.groups$ = this.snapcastService.groups$;
    // this.streams$ = this.snapcastService.streams$;
    // this.serverDetails$ = this.snapcastService.serverDetails$;
  }

  async ngOnInit() {
    // this.snapcastService.connect();

     this.userPreferenceServerUrl = await this.getUserPreferenceServerUrl();
    this.userPreeferenceUsername = await this.getUserName();

    this.displayState = this.snapcastService.state$;
    this.displayState.pipe(first()).subscribe((state) => {
      if (state) {
        console.log('Server state loaded:', state);
        this.isLoading = false;
      } else {
        console.log('No server state available');
      }
    });
    this.noServerTimeout();

  }

  async ionViewWillEnter() {
    console.log('ionViewWillEnter called');
    // Ensure the service is connected and fetch the latest data
    try {
      this.snapcastService.connect();
      this.ngOnInit(); // Re-initialize to fetch the latest state
      console.log('Connected to Snapcast server');
    } catch (error) {
      console.error('Error connecting to Snapcast server:', error);
    }
  }

  onSlideChange(event: any) {
    console.log('slide change');
  }

  onSwiper(event: any) {
    console.log('swiper');
  }

  openModal() {
    console.log('Open modal for device:');
    // Here you would typically open a modal with the device details
  }

  getPlayerStatus(): void {
  }

  getDeviceStatus(): void {
    // This method would typically fetch the device status from a service
    console.log('Fetching device status...');
  }

  // async getStreamDataById(streamId: string): Promise<Stream | undefined> {
  //   // This method would typically fetch the stream data by ID from a service
  //   console.log(`Fetching stream data for ID: ${streamId}`);
  //   const streams = await firstValueFrom(this.streams$);
  //   return streams.find(stream => stream.id === streamId);
  // }

  noServerTimeout(): void {
    // wait 10 seconds before timing out search for server
    setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        console.error('No Snapcast server found after 10 seconds.');
      }
    }, 10000);

  }

  async getUserPreferenceServerUrl(): Promise<string | undefined> {
    try {
      const result = await Preferences.get({ key: UserPreference.SERVER_URL });
      this.userPreferenceServerUrl = result.value;
      console.log('User preference server URL:', this.userPreferenceServerUrl);
      return this.userPreferenceServerUrl;
    } catch (error) {
      console.error('Error retrieving user preference server URL:', error);
      return undefined;
    }
  }

  async getUserName(): Promise<string | undefined> {
    try {
      const result = await Preferences.get({ key: UserPreference.USERNAME });
      console.log('Username:', result.value);
      return result.value;
    } catch (error) {
      console.error('Error retrieving username:', error);
      return undefined;
    }
  }








}
