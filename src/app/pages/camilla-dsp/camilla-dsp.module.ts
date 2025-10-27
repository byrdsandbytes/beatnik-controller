import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CamillaDspPageRoutingModule } from './camilla-dsp-routing.module';

import { CamillaDspPage } from './camilla-dsp.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CamillaDspPageRoutingModule
  ],
  declarations: [CamillaDspPage]
})
export class CamillaDspPageModule {}
