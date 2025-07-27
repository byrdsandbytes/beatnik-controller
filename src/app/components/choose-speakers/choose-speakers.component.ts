import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { first, firstValueFrom } from 'rxjs';
import { Speaker } from 'src/app/model/speaker.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-choose-speakers',
  templateUrl: './choose-speakers.component.html',
  styleUrls: ['./choose-speakers.component.scss'],
  // import ionic module here if needed
  imports: [
    IonicModule,
    FormsModule,
    CommonModule
  ],
  standalone: true
})
export class ChooseSpeakersComponent implements OnInit {

  @Input() clientId?: string;

  selectedId: string | undefined;
  speakers: Speaker[] = [];

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private snapcastService: SnapcastService
  ) { }

  ngOnInit() {
    this.loadSpeakerJson();
  }

  closeModal() {
    this.modalController.dismiss(null, null, 'choose-speakers-modal');
  }

  saveSelection() {
    if (this.selectedId) {
      console.log('Selected speaker ID:', this.selectedId);
      // Here you would typically save the selection to the server or state
      this.modalController.dismiss({ selectedId: this.selectedId }, 'save', 'choose-speakers-modal');
    } else {
      console.error('No speaker selected');
    }
  }

  async loadSpeakerJson() {
    //  get speaker data as promise
    try {
      const response = await firstValueFrom(
        this.http.get<{ speakers: Speaker[] }>('assets/speakers/speakers-data.json')
      );
      this.speakers = response.speakers;
      console.log('Speakers loaded:', this.speakers);
      return this.speakers;
    } catch (error) {
      console.error('Error loading speakers:', error);
      return [];
    }
  }

  async selectSpeaker(speakerId: string) {
    // set speaker id as client name
    this.selectedId = speakerId;
    console.log('Selected speaker:', this.selectedId);
    this.snapcastService.setClientName(this.clientId, speakerId).subscribe({
      next: (response) => {
        console.log(`Successfully set speaker for client ${this.clientId} to ${speakerId}`, response);
      },
      error: (error) => {
        console.error(`Failed to set speaker for client ${this.clientId}`, error);
      }
    });
  }

}
