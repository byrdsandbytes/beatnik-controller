import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { StreamPresetsService } from '../../services/stream-presets.service';
import { StreamPreset } from '../../model/stream-presets.model';
import { SnapcastService } from '../../services/snapcast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-stream-preset-edit',
  templateUrl: './stream-preset-edit.page.html',
  styleUrls: ['./stream-preset-edit.page.scss'],
  standalone: false
})
export class StreamPresetEditPage implements OnInit {
  caputredPreset: StreamPreset = { id: crypto.randomUUID(), presetName: '', data: [] };
  isEditMode: boolean = false;
  originalPresetName: string = '';
  availableStreams: any[] = [];

  constructor(
    private streamPresetsService: StreamPresetsService,
    private snapcastService: SnapcastService,
    private alertController: AlertController,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['preset']) {
      const preset = navigation.extras.state['preset'];
      // Deep copy so we don't accidentally mutate the store directly until saved
      this.caputredPreset = JSON.parse(JSON.stringify(preset));
      this.isEditMode = true;
      this.originalPresetName = this.caputredPreset.presetName;
    }
  }

  async ngOnInit() {
    await this.loadAvailableStreams();
    if (!this.isEditMode) {
      await this.capturePreset();
    }
  }

  async loadAvailableStreams() {
    const currentState = await firstValueFrom(this.snapcastService.getServerStatus());
    if (currentState && currentState.server) {
      this.availableStreams = currentState.server.streams;
    }
  }

  async capturePreset() {
    const preset = await this.streamPresetsService.capturePreset();
    if (preset) {
      console.log('Captured Stream Preset:', preset);
      // Keep existing name/description if re-capturing in edit mode
      this.caputredPreset = {
        ...this.caputredPreset,
        data: preset.data
      };
    }
  }

  async savePresetInUserPreferences() {
    if (!this.isEditMode) {
      const name = await this.promtNameAlert();
      if (!name) {
        console.warn('StreamPresetEditPage: Preset name is required to save');
        return;
      }
      this.caputredPreset.presetName = name.presetName;
      this.caputredPreset.presetDescription = name.presetDescription || '';
    } else {
      // In edit mode we can also allow renaming, or keep it simple
      const confirmState = await this.promtNameAlert(this.caputredPreset.presetName, this.caputredPreset.presetDescription);
      if (!confirmState) {
        return;
      }
      this.caputredPreset.presetName = confirmState.presetName;
      this.caputredPreset.presetDescription = confirmState.presetDescription || '';
    }
    
    try {
      await this.streamPresetsService.savePreset(this.caputredPreset);
      console.log('Stream preset saved to user preferences');
      this.router.navigate(['/stream-presets'], { replaceUrl: true });
    } catch (error) {
      console.error('StreamPresetEditPage: Failed to save preset', error);
    }
  }

  async promtNameAlert(defaultName: string = '', defaultDescription: string = ''): Promise<{presetName: string, presetDescription?: string} | null> {
    const alert = await this.alertController.create({
      header: 'Save Stream Preset',
      inputs: [
        {
          name: 'presetName',
          type: 'text',
          placeholder: 'Enter preset name',
          value: defaultName
        },
        {
          name: 'presetDescription',
          type: 'text',
          placeholder: 'Enter preset description (optional)',
          value: defaultDescription
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data: any) => {
            return { presetName: data.presetName, presetDescription: data.presetDescription };
          }
        }
      ]
    });

    await alert.present();
    const { data } = await alert.onDidDismiss();
    return data?.values || null;
  }
}
