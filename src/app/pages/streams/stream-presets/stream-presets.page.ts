import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StreamPresetsService } from '../../../services/stream-presets.service';
import { StreamPreset } from '../../../model/stream-presets.model';
import { SnapcastService } from '../../../services/snapcast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-stream-presets',
  templateUrl: './stream-presets.page.html',
  styleUrls: ['./stream-presets.page.scss'],
  standalone: false
})
export class StreamPresetsPage implements OnInit {

  existingPresets: StreamPreset[] = [];
  defaultPresets: StreamPreset[] = [];

  constructor(
    private streamPresetsService: StreamPresetsService,
    private snapcastService: SnapcastService,
    private router: Router,
    private toastController: ToastController,
  ) { }

  ngOnInit() {
  }

  async ionViewWillEnter() {
    await this.loadPresetFromUserPreferences();
    await this.generateDefaultPresets();
  }

  async loadPresetFromUserPreferences() {
    this.existingPresets = await this.streamPresetsService.loadPresetsFromPreferences();
    console.log('StreamPresetsPage: Retrieved stream presets:', this.existingPresets);
  }

  async generateDefaultPresets() {
    try {
      const currentState = await firstValueFrom(this.snapcastService.getServerStatus());
      if (currentState && currentState.server) {
        const streams = currentState.server.streams;
        const groups = currentState.server.groups;

        this.defaultPresets = streams.map(stream => {
          const presetData = groups.map(group => ({
            groupId: group.id,
            groupName: group.name || '',
            streamId: stream.id
          }));

          return {
            id: `default-${stream.id}`,
            presetName: `All to ${stream.id}`,
            presetDescription: `Assigns ${stream.id} to all groups`,
            data: presetData
          };
        });
      }
    } catch (error) {
      console.error('Failed to generate default presets:', error);
    }
  }

  async applyPreset(preset: StreamPreset) {
    try {
      await this.streamPresetsService.applyPreset(preset);
      
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

  editPreset(preset: StreamPreset) {
    this.router.navigate(['/stream-preset-edit'], { state: { preset } });
  }

  async deletePreset(preset: StreamPreset) {
    try {
      this.existingPresets = await this.streamPresetsService.deletePreset(preset);
      console.log(`Stream preset "${preset.presetName}" deleted`);
    } catch (error) {
      console.error(`StreamPresetsPage: Failed to delete preset "${preset.presetName}"`, error);
    }
  }
}
