import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CamillaDspPageRoutingModule } from './camilla-dsp-routing.module';

import { CamillaDspPage } from './camilla-dsp.page';
import { CamillaDspModule } from 'src/app/components/camilla-dsp/camilla-dsp.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CamillaDspPageRoutingModule,
    CamillaDspModule
  ],
  declarations: [CamillaDspPage]
})
export class CamillaDspPageModule {}
