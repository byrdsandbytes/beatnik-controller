import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CamillaDspComponent } from './camilla-dsp.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [CamillaDspComponent],
  exports: [CamillaDspComponent]
})
export class CamillaDspModule {}
