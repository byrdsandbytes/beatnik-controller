import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StreamsPageRoutingModule } from './streams-routing.module';

import { StreamsPage } from './streams.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StreamsPageRoutingModule
  ],
  declarations: [StreamsPage]
})
export class StreamsPageModule {}
