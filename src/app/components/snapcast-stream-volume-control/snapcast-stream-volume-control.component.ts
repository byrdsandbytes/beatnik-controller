import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Client, Group, Stream } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-snapcast-stream-volume-control',
  templateUrl: './snapcast-stream-volume-control.component.html',
  styleUrls: ['./snapcast-stream-volume-control.component.scss'],
  standalone: false
})
export class SnapcastStreamVolumeControlComponent implements OnInit {

  @Input() stream?: Stream;
  @Input() groups?: Group[] | null;

  @Output() streamVolumeChange: EventEmitter<number> = new EventEmitter<number>();

  streamVolume: number = 0;
  clietsInStream: Client[] = [];


  knobMoveStartValue: number = 0;
  knobMoveRealtimeValue: number = 0;
  knobMoveDelta: number = 0;

  constructor(
    private snapcastService: SnapcastService
  ) { }

  ngOnInit() {
    if (!this.stream || !this.groups) {
      console.warn('Stream or groups not provided');
      return;
    }

    this.calaculateStreamVolume(this.stream);
  }




  calaculateStreamVolume(stream: Stream): number {
    if (!stream || !this.groups) {
      return 0;
    }
    const groupsWIthStream = this.groups.filter(group => group.stream_id === stream.id);
    const clients: Client[] = [];
    for (const group of groupsWIthStream) {
      if (group.clients) {
        clients.push(...group.clients);
      }
    }
    if (clients.length === 0) {
      return 0;
    }
    // Calculate the average volume across all clients in the stream
    const totalVolume = clients.reduce((sum, client) => {
      return sum + (client.config?.volume?.percent || 0);
    }
      , 0);
    const averageVolume = totalVolume / clients.length;
    console.log(`Average volume for stream ${stream.id}: ${averageVolume}`);
    this.streamVolume = Math.round(averageVolume);
    this.clietsInStream = clients;
    return Math.round(averageVolume);
  }

  changeStreamVolume(event: any): void {
    console.log("Event: ", event);

  }

  changeStreambasedOnClientsVolume(stream: Stream): void {
    for (const client of this.clietsInStream) {
      if (client.config && client.config.volume && typeof client.config.volume.percent === 'number') {
        const initialVolume = client.config.volume.percent;
        const targetVolume = initialVolume + this.knobMoveDelta;
        // Ensure the target volume is within the valid range
        const clampedVolume = Math.max(0, Math.min(100, targetVolume));
        console.log(`Setting volume for client ${client.id} from ${initialVolume} to ${clampedVolume}`);
        // Here you would typically call a service to set the volume
        this.snapcastService.setClientVolumePercent(client.id, clampedVolume).subscribe({
          next: () => {
            console.log(`Volume for client ${client.id} set to ${clampedVolume}`);
          },
          error: err => console.error(`Failed to set volume for client ${client.id}`, err)
        });
      }
    }
  }

  calculateKnobMoveDelta(event: any): void {
    const currentValue = event.detail.value;
    if (this.knobMoveStartValue === 0) {
      this.knobMoveStartValue = currentValue;
    }
    this.knobMoveRealtimeValue = currentValue;
    this.knobMoveDelta = this.knobMoveRealtimeValue - this.knobMoveStartValue;
    console.log(`Knob move delta: ${this.knobMoveDelta}`);
    if (this.knobMoveDelta !== 0) {
      this.changeStreambasedOnClientsVolume(this.stream!);
    }
  }

}
