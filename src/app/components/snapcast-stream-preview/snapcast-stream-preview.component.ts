import { Component, Input, OnInit } from '@angular/core';
import { Stream } from 'src/app/model/snapcast.model';
import { CoverDataService } from 'src/app/services/cover-data.service';

@Component({
  selector: 'app-snapcast-stream-preview',
  templateUrl: './snapcast-stream-preview.component.html',
  styleUrls: ['./snapcast-stream-preview.component.scss'],
  standalone: false,
})
export class SnapcastStreamPreviewComponent  implements OnInit {
  @Input() stream?: Stream;

  constructor(
    private coverDateService: CoverDataService
  ) { }

  ngOnInit() {}

  
  convertCoverDataBase64(coverData: string, extension: string): string {
    return this.coverDateService.convertCoverDataBase64(coverData, extension);
  }

  onCoverImageError(event: Event): void {
    this.coverDateService.onCoverImageError(event);
  }

}
