import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FullScrrenDspPageRoutingModule } from './full-scrren-dsp-routing.module';

import { FullScrrenDspPage } from './full-scrren-dsp.page';
import { CamillaDspModule } from 'src/app/components/camilla-dsp/camilla-dsp.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CamillaDspModule,
    FullScrrenDspPageRoutingModule
  ],
  declarations: [FullScrrenDspPage]
})
export class FullScrrenDspPageModule {}
