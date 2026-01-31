import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClientDetailsPageRoutingModule } from './client-details-routing.module';

import { ClientDetailsPage } from './client-details.page';
import { CamillaDspModule } from 'src/app/components/camilla-dsp/camilla-dsp.module';
import { SoundcardPickerModule } from 'src/app/components/soundcard-picker/soundcard-picker.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClientDetailsPageRoutingModule,
    CamillaDspModule,
    SoundcardPickerModule
  ],
  declarations: [ClientDetailsPage]
})
export class ClientDetailsPageModule {}
