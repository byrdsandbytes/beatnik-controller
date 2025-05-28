import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerToolbarComponent } from './player-toolbar.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SnapcastStreamVolumeControlModule } from '../snapcast-stream-volume-control/snapcast-stream-volume-control.module';



@NgModule({
  declarations: [
    PlayerToolbarComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    SnapcastStreamVolumeControlModule
  ],
  exports: [
    PlayerToolbarComponent
  ]
})
export class PlayerToolbarModule { }
