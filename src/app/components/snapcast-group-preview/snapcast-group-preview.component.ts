import { Component, Input, OnInit } from '@angular/core';
import { Group, Stream } from 'src/app/model/snapcast.model';

@Component({
  selector: 'app-snapcast-group-preview',
  templateUrl: './snapcast-group-preview.component.html',
  styleUrls: ['./snapcast-group-preview.component.scss'],
  standalone: false
})
export class SnapcastGroupPreviewComponent  implements OnInit {

  @Input() group?: Group;
  @Input() streams?: Stream[] | null;

  activeStream?: Stream;

  constructor() { }

  ngOnInit() {
    this.getActiveStream();
  }

  getStreamById(streamId: string): Stream | undefined {
    return this.streams?.find(stream => stream.id === streamId);
  }


  getActiveStream(): Stream | undefined {
    if (!this.group || !this.streams) {
      return undefined;
    }
    this.activeStream = this.getStreamById(this.group.stream_id);
    return this.activeStream;
  }

}
