import { Component, OnInit } from '@angular/core';
import { SnapCastServerStatusResponse, Stream } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { SwiperOptions } from 'swiper';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false
})
export class DashboardPage implements OnInit {

  devices = [{
    name: 'Wohnzimmer Links',
    groupName: 'Wohnzimmer',
    imgUrl: 'assets/mock/JSE_small_002.png',
    status: 'online',
    coverUrl: 'assets/mock/2-freewheelin-bob-dylan.webp',
    artist: 'Bob Dylan',
    song: 'Blowin in the Wind',
    album: 'Freewheelin',
  },
  {
    name: 'Wohnzimmer Links',
    groupName: 'Wohnzimmer',
    imgUrl: 'assets/mock/JSE_small.png',
    status: 'online',
    coverUrl: 'assets/mock/2-freewheelin-bob-dylan.webp',
    artist: 'Bob Dylan',
    song: 'Blowin in the Wind',
    album: 'Freewheelin',
  },
  {
    name: 'Wohnzimmer Rechts',
    groupName: 'Wohnzimmer',
    imgUrl: 'assets/mock/boxe_Aeg_frei_frontal_004.png',
    status: 'online',
    coverUrl: 'assets/mock/2-freewheelin-bob-dylan.webp',
    artist: 'Artist 1',
    song: 'Song 1',
    album: 'Album 1',
  },
  ];

  swiperConfig: SwiperOptions = {
    slidesPerView: 1.3,
    spaceBetween: 10,
  };







  today: Date = new Date();

  status?: SnapCastServerStatusResponse

  constructor(
    private readonly snapcastService: SnapcastService,
  ) { }

  ngOnInit() {
    // this.snapcastService.connect();
    // this.snapcastService.status.subscribe(status => {
    //   console.log('Server Status:', status);
    //   this.status = status;
    // });

    this.snapcastService.subToSocket();

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

  getStreamDataById(streamId: string): Stream{
    const stream = this.status?.server.streams?.find(s => s.id === streamId);
    if (!stream) {
      throw new Error(`Stream with ID ${streamId} not found`);
    }
    return stream;
  }



}
