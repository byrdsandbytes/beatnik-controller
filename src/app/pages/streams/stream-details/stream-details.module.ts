import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StreamDetailsPageRoutingModule } from './stream-details-routing.module';

import { StreamDetailsPage } from './stream-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StreamDetailsPageRoutingModule
  ],
  declarations: [StreamDetailsPage]
})
export class StreamDetailsPageModule {}
