import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { first, firstValueFrom, interval, Observable } from 'rxjs';
import { Client, Group, ServerDetail, SnapCastServerStatusResponse, Stream } from 'src/app/model/snapcast.model';
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

  hasAnyPlayingClients = false;
  hasPlayingStreams = false;
  numberOfPlayingClients = 0;
  numberOfPlayingStreams = 0;
  totalClients = 0;
  totalStreams = 0;
  lastServerResponseTime?: Date;
  lastServerResponseDeltaInSeconds?: number;



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

    this.displayState.subscribe(state => {
      if (state) {
        this.lastServerResponseTime = new Date();
        this.checkForPlayingStreamsAndClients();
      } else {
        console.warn('SnapcastStateIndicatorService: No state available to check for playing streams and clients.');
      }
    });

    interval(1000).subscribe(() => {
      const today = new Date();
      this.lastServerResponseDeltaInSeconds = Math.floor((today.getTime() - (this.lastServerResponseTime?.getTime() || today.getTime())) / 1000);
    });

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

  async checkForPlayingStreamsAndClients(): Promise<void> {
    console.log('PlayerToolbarComponent: Checking for playing streams and clients...');
    const state = await firstValueFrom(this.displayState);
    if (!state) {
      console.warn('PlayerToolbarComponent: No state available to check for playing streams and clients.');
      return;
    }
    // Check if there are any playing streams
    this.hasPlayingStreams = state.server.streams.some(stream => stream.status === 'playing');
    console.log('PlayerToolbarComponent: hasPlayingStreams:', this.hasPlayingStreams);
    // Check if there are any playing clients, i.e., clients that have a playing stream asigned
    this.hasAnyPlayingClients = state.server.groups.some((group: Group) =>
      group.clients.some((client: Client) => {
        const clientStream = state.server.streams.find(stream => stream.id === group.stream_id);
        return client.connected && clientStream && clientStream.status === 'playing';
      })
    );
    console.log('PlayerToolbarComponent: hasAnyPlayingClients:', this.hasAnyPlayingClients);
    this.numberOfPlayingClients = state.server.groups.reduce((count, group) => {
      return count + group.clients.filter(client => client.connected && state.server.streams.some(stream => stream.id === group.stream_id && stream.status === 'playing')).length;
    }, 0);
    console.log('PlayerToolbarComponent: numberOfPlayingClients:', this.numberOfPlayingClients);
    this.numberOfPlayingStreams = state.server.streams.filter(stream => stream.status === 'playing').length;
    console.log('PlayerToolbarComponent: numberOfPlayingStreams:', this.numberOfPlayingStreams);

    this.totalClients = state.server.groups.reduce((total, group) => total + group.clients.length, 0);
    console.log('PlayerToolbarComponent: totalClients:', this.totalClients);

    this.totalStreams = state.server.streams.length;
    console.log('PlayerToolbarComponent: totalStreams:', this.totalStreams);

  }

 








}
