import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VolumePresetsPageRoutingModule } from './volume-presets-routing.module';

import { VolumePresetsPage } from './volume-presets.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VolumePresetsPageRoutingModule
  ],
  declarations: [VolumePresetsPage]
})
export class VolumePresetsPageModule {}
