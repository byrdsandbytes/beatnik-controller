import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnapcastGroupPreviewComponent } from './snapcast-group-preview.component';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ClientNameModule } from 'src/app/client-name/client-name.module';



@NgModule({
  declarations: [SnapcastGroupPreviewComponent],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    ClientNameModule
  ],
  exports: [SnapcastGroupPreviewComponent],
})
export class SnapcastGroupPreviewModule { }
