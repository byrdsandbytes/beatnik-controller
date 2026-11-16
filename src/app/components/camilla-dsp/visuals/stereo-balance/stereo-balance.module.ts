import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { StereoBalanceComponent } from './stereo-balance.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [StereoBalanceComponent],
  exports: [StereoBalanceComponent]
})
export class StereoBalanceModule {}
