import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SetupServerPageRoutingModule } from './setup-server-routing.module';

import { SetupServerPage } from './setup-server.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SetupServerPageRoutingModule
  ],
  declarations: [SetupServerPage]
})
export class SetupServerPageModule {}
