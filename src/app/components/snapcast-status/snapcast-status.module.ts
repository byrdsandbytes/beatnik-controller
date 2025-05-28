import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastStatusComponent } from './snapcast-status.component';



@NgModule({
  declarations: [SnapcastStatusComponent],
  imports: [
    CommonModule
  ],
  exports: [SnapcastStatusComponent],
})
export class SnapcastStatusModule { }
