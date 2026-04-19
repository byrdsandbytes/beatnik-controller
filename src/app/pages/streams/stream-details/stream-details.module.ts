import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StreamDetailsPageRoutingModule } from './stream-details-routing.module';

import { StreamDetailsPage } from './stream-details.page';
import { CamillaDspModule } from 'src/app/components/camilla-dsp/camilla-dsp.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StreamDetailsPageRoutingModule,
    CamillaDspModule
  ],
  declarations: [StreamDetailsPage]
})
export class StreamDetailsPageModule {}
