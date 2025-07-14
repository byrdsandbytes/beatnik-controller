import { Component, Input, OnInit } from '@angular/core';
import { Stream } from 'src/app/model/snapcast.model';

@Component({
  selector: 'app-snapcast-stream-preview',
  templateUrl: './snapcast-stream-preview.component.html',
  styleUrls: ['./snapcast-stream-preview.component.scss'],
  standalone: false,
})
export class SnapcastStreamPreviewComponent  implements OnInit {
  @Input() stream?: Stream;

  constructor() { }

  ngOnInit() {}

  
  convertCoverDataBase64(coverData: string, extension: string): string {
    if (!coverData) {
      return '';
    }
    // Convert base64 data to a data URL
    return `data:image/${extension};base64,${coverData}`;
  }

}
