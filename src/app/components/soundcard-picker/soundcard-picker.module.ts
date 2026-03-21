import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SoundcardPickerComponent } from './soundcard-picker.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [SoundcardPickerComponent],
  imports: [CommonModule, IonicModule, FormsModule],
  exports: [SoundcardPickerComponent],
})
export class SoundcardPickerModule {}
