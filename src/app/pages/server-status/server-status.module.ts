import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ServerStatusPageRoutingModule } from './server-status-routing.module';

import { ServerStatusPage } from './server-status.page';
import { SnapcastStatusModule } from 'src/app/components/snapcast-status/snapcast-status.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ServerStatusPageRoutingModule,
    SnapcastStatusModule
  ],
  declarations: [ServerStatusPage]
})
export class ServerStatusPageModule {}
