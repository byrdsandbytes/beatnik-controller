import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { SwiperModule } from 'swiper/angular';
import { SnapcastStatusModule } from 'src/app/components/snapcast-status/snapcast-status.module';
import { SnapcastGroupPreviewModule } from 'src/app/components/snapcast-group-preview/snapcast-group-preview.module';
import { RouterModule } from '@angular/router';
import { SnapcastStreamPreviewModule } from 'src/app/components/snapcast-stream-preview/snapcast-stream-preview.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    SwiperModule,
    SnapcastStatusModule,
    SnapcastGroupPreviewModule,
    RouterModule,
    SnapcastStreamPreviewModule
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
