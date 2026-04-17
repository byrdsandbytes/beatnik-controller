import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { VolumePresetsService } from '../../services/volume-presets.service';
import { VolumePreset, VolumePresetData } from '../../model/volume-presets.model';

@Component({
  selector: 'app-volume-presets',
  templateUrl: './volume-presets.page.html',
  styleUrls: ['./volume-presets.page.scss'],
  standalone: false
})
export class VolumePresetsPage implements OnInit {
  

  caputredPreset: VolumePreset = { presetName: '', data: [] };

  existingPresets: VolumePreset[] = [];

  constructor(
    private volumePresetsService: VolumePresetsService,
    private alertController: AlertController,
  ) { }

  async ngOnInit() {
    await this.loadPresetFromUserPreferences();
  }

  async capturePreset() {
    const preset = await this.volumePresetsService.capturePreset();
    if (preset) {
      console.log('Captured Volume Preset:', preset);
      this.caputredPreset = preset;
    }
  }

  async savePresetInUserPreferences() {
    const name = await this.promtNameAlert();
    if (!name) {
      console.warn('VolumePresetsPage: Preset name is required to save preset');
      return;
    }
    this.caputredPreset.presetName = name.presetName;
    this.caputredPreset.presetDescription = name.presetDescription || '';
    
    try {
      this.existingPresets = await this.volumePresetsService.savePreset(this.caputredPreset);
      console.log('Volume preset saved to user preferences');
      this.caputredPreset = { presetName: '', presetDescription: '', data: [] }; // Clear the captured preset after saving
    } catch (error) {
      console.error('VolumePresetsPage: Failed to save preset', error);
    }
  }

  async promtNameAlert(): Promise<{presetName: string, presetDescription?: string} | null> {
    const alert = await this.alertController.create({
      header: 'Save Volume Preset',
      inputs: [
        {
          name: 'presetName',
          type: 'text',
          placeholder: 'Enter preset name'
        },
        {
          name: 'presetDescription',
          type: 'text',
          placeholder: 'Enter preset description (optional)'
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
            this.caputredPreset.presetDescription = data.presetDescription || '';
            return { presetName: data.presetName, presetDescription: data.presetDescription };
          }
        }
      ]
    });

    await alert.present();
    const { data } = await alert.onDidDismiss();
    return data?.values || null;
  }

  async loadPresetFromUserPreferences() {
    this.existingPresets = await this.volumePresetsService.loadPresetsFromPreferences();
    console.log('VolumePresetsPage: Retrieved volume presets:', this.existingPresets);
  }

  async applyPreset(preset: VolumePreset) {
    await this.volumePresetsService.applyPreset(preset);
  }

  async deletePreset(preset: VolumePreset) {
    try {
      this.existingPresets = await this.volumePresetsService.deletePreset(preset);
      console.log(`Volume preset "${preset.presetName}" deleted`);
    } catch (error) {
      console.error(`VolumePresetsPage: Failed to delete preset "${preset.presetName}"`, error);
    }
  }

}
