import { Component, Input, OnInit } from '@angular/core';
import { Stream } from 'src/app/model/snapcast.model';
import { toImageDataUrl } from 'src/app/utils/image.utils';

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

  
  convertCoverDataBase64 = toImageDataUrl;

}
