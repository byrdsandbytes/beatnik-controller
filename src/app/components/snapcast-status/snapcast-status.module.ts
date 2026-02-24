import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastStatusComponent } from './snapcast-status.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [SnapcastStatusComponent],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  exports: [SnapcastStatusComponent],
})
export class SnapcastStatusModule { }
