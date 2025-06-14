import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StreamsPageRoutingModule } from './streams-routing.module';

import { StreamsPage } from './streams.page';
import { SnapcastStreamPreviewModule } from 'src/app/components/snapcast-stream-preview/snapcast-stream-preview.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StreamsPageRoutingModule,
    SnapcastStreamPreviewModule
  ],
  declarations: [StreamsPage]
})
export class StreamsPageModule {}
