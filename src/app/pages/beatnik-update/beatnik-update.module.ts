import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BeatnikUpdatePageRoutingModule } from './beatnik-update-routing.module';

import { BeatnikUpdatePage } from './beatnik-update.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BeatnikUpdatePageRoutingModule
  ],
  declarations: [BeatnikUpdatePage]
})
export class BeatnikUpdatePageModule {}
