import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { first, firstValueFrom, Observable } from 'rxjs';
import { Group, ServerDetail, SnapCastServerStatusResponse, Stream } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';
import { SwiperOptions } from 'swiper';

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

  public groups$: Observable<Group[]>;
  public streams$: Observable<Stream[]>;
  public serverDetails$: Observable<ServerDetail | undefined>;

  constructor(public snapcastService: SnapcastService,
  ) {
    this.groups$ = this.snapcastService.groups$;
    this.streams$ = this.snapcastService.streams$;
    this.serverDetails$ = this.snapcastService.serverDetails$;
  }

  ngOnInit() {
    this.displayState = this.snapcastService.displayState$


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





}
