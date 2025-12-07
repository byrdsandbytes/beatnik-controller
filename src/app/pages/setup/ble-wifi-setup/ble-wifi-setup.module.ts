import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BleWifiSetupPageRoutingModule } from './ble-wifi-setup-routing.module';

import { BleWifiSetupPage } from './ble-wifi-setup.page';
import { SwiperModule } from 'swiper/angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BleWifiSetupPageRoutingModule,
    SwiperModule
  ],
  declarations: [BleWifiSetupPage]
})
export class BleWifiSetupPageModule {}
