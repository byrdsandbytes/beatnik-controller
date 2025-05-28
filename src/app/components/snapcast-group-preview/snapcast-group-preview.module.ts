import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastGroupPreviewComponent } from './snapcast-group-preview.component';
import { IonicModule } from '@ionic/angular';



@NgModule({
  declarations: [SnapcastGroupPreviewComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [SnapcastGroupPreviewComponent],
})
export class SnapcastGroupPreviewModule { }
