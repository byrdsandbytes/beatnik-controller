import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BeatnikUpdatePageRoutingModule } from './beatnik-update-routing.module';

import { BeatnikDeviceUpdateModule } from '../../beatnik-device-update/beatnik-device-update-module';
import { BeatnikUpdatePage } from './beatnik-update.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BeatnikDeviceUpdateModule,
    BeatnikUpdatePageRoutingModule
  ],
  declarations: [BeatnikUpdatePage]
})
export class BeatnikUpdatePageModule {}
