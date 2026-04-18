import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VolumePresetEditPageRoutingModule } from './volume-preset-edit-routing.module';

import { VolumePresetEditPage } from './volume-preset-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VolumePresetEditPageRoutingModule
  ],
  declarations: [VolumePresetEditPage]
})
export class VolumePresetEditPageModule {}
