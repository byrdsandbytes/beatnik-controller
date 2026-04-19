import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { VolumePresetsService } from '../../services/volume-presets.service';
import { VolumePreset } from '../../model/volume-presets.model';

@Component({
  selector: 'app-volume-presets',
  templateUrl: './volume-presets.page.html',
  styleUrls: ['./volume-presets.page.scss'],
  standalone: false
})
export class VolumePresetsPage implements OnInit {
  
  existingPresets: VolumePreset[] = [];

  constructor(
    private volumePresetsService: VolumePresetsService,
    private router: Router,
    private toastController: ToastController,
  ) { }

  ngOnInit() {
  }

  async ionViewWillEnter() {
    await this.loadPresetFromUserPreferences();
  }

  async loadPresetFromUserPreferences() {
    this.existingPresets = await this.volumePresetsService.loadPresetsFromPreferences();
    console.log('VolumePresetsPage: Retrieved volume presets:', this.existingPresets);
  }

  async applyPreset(preset: VolumePreset) {
    try {
      await this.volumePresetsService.applyPreset(preset);
      
      await Haptics.impact({ style: ImpactStyle.Light });
      
      const toast = await this.toastController.create({
        message: `Preset "${preset.presetName}" applied`,
        duration: 2000,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle-outline'
      });
      await toast.present();
    } catch (error) {
      console.error('Failed to apply preset', error);
      
      const errorToast = await this.toastController.create({
        message: `Failed to apply preset "${preset.presetName}"`,
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
      await errorToast.present();
    }
  }

  editPreset(preset: VolumePreset) {
    this.router.navigate(['/volume-preset-edit'], { state: { preset } });
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
