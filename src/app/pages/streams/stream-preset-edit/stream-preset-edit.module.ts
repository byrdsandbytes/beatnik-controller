import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StreamPresetEditPageRoutingModule } from './stream-preset-edit-routing.module';

import { StreamPresetEditPage } from './stream-preset-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StreamPresetEditPageRoutingModule
  ],
  declarations: [StreamPresetEditPage]
})
export class StreamPresetEditPageModule {}
