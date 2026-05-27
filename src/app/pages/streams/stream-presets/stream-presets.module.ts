import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StreamPresetsPageRoutingModule } from './stream-presets-routing.module';

import { StreamPresetsPage } from './stream-presets.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StreamPresetsPageRoutingModule
  ],
  declarations: [StreamPresetsPage]
})
export class StreamPresetsPageModule {}
