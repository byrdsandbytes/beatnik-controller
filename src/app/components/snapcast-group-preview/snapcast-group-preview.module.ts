import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastGroupPreviewComponent } from './snapcast-group-preview.component';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [SnapcastGroupPreviewComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ],
  exports: [SnapcastGroupPreviewComponent],
})
export class SnapcastGroupPreviewModule { }
