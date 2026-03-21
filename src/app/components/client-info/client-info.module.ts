import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ClientInfoComponent } from './client-info.component';
import { FormsModule } from '@angular/forms';
import { CamillaDspModule } from '../camilla-dsp/camilla-dsp.module';
import { SoundcardPickerModule } from '../soundcard-picker/soundcard-picker.module';

@NgModule({
  declarations: [ClientInfoComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    CamillaDspModule,
    SoundcardPickerModule,
  ],
  exports: [ClientInfoComponent],
})
export class ClientInfoModule {}
