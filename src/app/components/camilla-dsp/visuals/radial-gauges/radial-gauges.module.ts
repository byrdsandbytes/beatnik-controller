import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RadialGaugesComponent } from './radial-gauges.component';

@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [RadialGaugesComponent],
  exports: [RadialGaugesComponent]
})
export class RadialGaugesModule {}
