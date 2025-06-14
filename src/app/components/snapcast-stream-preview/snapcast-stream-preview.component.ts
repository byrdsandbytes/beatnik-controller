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

  convertBase64ToImage(base64String: string, format: string): string {
    return `data:image/${format};base64,${base64String}`;
  }

}
