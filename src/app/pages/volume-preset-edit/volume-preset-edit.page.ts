import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { VolumePresetsService } from '../../services/volume-presets.service';
import { VolumePreset } from '../../model/volume-presets.model';

@Component({
  selector: 'app-volume-preset-edit',
  templateUrl: './volume-preset-edit.page.html',
  styleUrls: ['./volume-preset-edit.page.scss'],
  standalone: false
})
export class VolumePresetEditPage implements OnInit {
  caputredPreset: VolumePreset = { presetName: '', data: [] };
  isEditMode: boolean = false;
  originalPresetName: string = '';

  constructor(
    private volumePresetsService: VolumePresetsService,
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
    if (!this.isEditMode) {
      await this.capturePreset();
    }
  }

  async capturePreset() {
    const preset = await this.volumePresetsService.capturePreset();
    if (preset) {
      console.log('Captured Volume Preset:', preset);
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
        console.warn('VolumePresetEditPage: Preset name is required to save');
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
      
      // If we renamed it, we should probably delete the old one first
      if (this.originalPresetName !== this.caputredPreset.presetName) {
        await this.volumePresetsService.deletePreset({ presetName: this.originalPresetName, data: [] });
      }
    }
    
    try {
      await this.volumePresetsService.savePreset(this.caputredPreset);
      console.log('Volume preset saved to user preferences');
      this.router.navigate(['/volume-presets'], { replaceUrl: true });
    } catch (error) {
      console.error('VolumePresetEditPage: Failed to save preset', error);
    }
  }

  async promtNameAlert(defaultName: string = '', defaultDescription: string = ''): Promise<{presetName: string, presetDescription?: string} | null> {
    const alert = await this.alertController.create({
      header: 'Save Volume Preset',
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
