import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Group, Stream } from 'src/app/model/snapcast.model';
import { Speaker } from 'src/app/model/speaker.model';

@Component({
  selector: 'app-snapcast-group-preview',
  templateUrl: './snapcast-group-preview.component.html',
  styleUrls: ['./snapcast-group-preview.component.scss'],
  standalone: false
})
export class SnapcastGroupPreviewComponent  implements OnInit, OnChanges {

  @Input() group?: Group;
  @Input() streams?: Stream[] | null;
  @Input() speakerData?: Speaker[] | null;

  activeStream?: Stream;
  activeSpeaker?: Speaker;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    this.getActiveStream();
    this.getActiveSpeaker();
  }

  ngOnChanges() {
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

  navToGroupDetails(): void {
    if (!this.group) {
      console.error('SnapcastGroupPreviewComponent: No group available to navigate to details');
      return;
    }
    // Navigate to the group details page using the group's ID
    // Assuming you have a route set up for group details like '/group-details/:id'
    this.router.navigate(['tabs/dashboard/devices', this.group.id]);
  }

  checkClientOnlineState(client: any): string {
    if (client.online) {
      return 'online';
    } else if (client.connecting) {
      return 'connecting';
    } else {
      return 'offline';
    }
  }

  convertCoverDataBase64(coverData: string, extension: string): string {
    if (!coverData) {
      return '';
    }
    // Convert base64 data to a data URL
    return `data:image/${extension};base64,${coverData}`;
  }

  getActiveSpeaker(): Speaker | undefined {
    if (!this.group || !this.speakerData) {
      return undefined;
    }
    // Hacky implementation of speaker selection
    this.activeSpeaker = this.speakerData.find(speaker => speaker.id === this.group.clients[0].config.name);
    if (!this.activeSpeaker) {
      console.warn('No active speaker found for the group:', this.group.id);
      return undefined;
    }
    console.log('Active speaker for group:', this.group.id, this.activeSpeaker);

    return this.activeSpeaker;
  }

}
