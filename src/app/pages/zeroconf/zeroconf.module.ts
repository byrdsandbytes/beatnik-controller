import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ZeroconfPageRoutingModule } from './zeroconf-routing.module';

import { ZeroconfPage } from './zeroconf.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ZeroconfPageRoutingModule
  ],
  declarations: [ZeroconfPage]
})
export class ZeroconfPageModule {}
