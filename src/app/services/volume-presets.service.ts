import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SnapcastService } from './snapcast.service';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../enum/user-preference.enum';
import { VolumePreset } from '../model/volume-presets.model';

@Injectable({
  providedIn: 'root'
})
export class VolumePresetsService {

  constructor(private snapcastService: SnapcastService) { }

  async capturePreset(): Promise<VolumePreset | null> {
    const currentState = await firstValueFrom(this.snapcastService.getServerStatus());
    if (!currentState || !currentState.server) {
      console.error('VolumePresetsService: Failed to capture preset - invalid server state', currentState);
      return null;
    }
    const preset = currentState.server.groups.flatMap((group: any) => group.clients).map((client: any) => ({
      clientId: client.id,
      volumePercent: client.config.volume.percent,
      groupId: currentState.server.groups.find((group: any) => group.clients?.some((c: any) => c.id === client.id))?.id || '',
      groupName: currentState.server.groups.find((group: any) => group.clients?.some((c: any) => c.id === client.id))?.name || '',
    }));
    return { id: crypto.randomUUID(), presetName: 'Preset_' + new Date().toISOString().replace(/[:.]/g, '-'), data: preset };
  }

  async loadPresetsFromPreferences(): Promise<VolumePreset[]> {
    try {
      const result = await Preferences.get({ key: UserPreference.VOLUME_PRESETS });
      if (result.value) {
        let presets = JSON.parse(result.value);
        let presetArray = Array.isArray(presets) ? presets : [presets];
        let needsMigration = false;
        
        let migratedArray = presetArray.map((p: any) => {
          if (!p.id) {
            p.id = crypto.randomUUID();
            needsMigration = true;
          }
          return p as VolumePreset;
        });

        if (needsMigration) {
          await Preferences.set({
            key: UserPreference.VOLUME_PRESETS,
            value: JSON.stringify(migratedArray)
          });
        }
        
        return migratedArray;
      }
    } catch (error) {
      console.error('VolumePresetsService: Failed to load preset from user preferences', error);
    }
    return [];
  }

  async savePreset(newPreset: VolumePreset): Promise<VolumePreset[]> {
    const existingPresets = await this.loadPresetsFromPreferences();
    const existingIndex = existingPresets.findIndex((p: VolumePreset) => p.id === newPreset.id);
    
    if (existingIndex >= 0) {
      existingPresets[existingIndex] = newPreset;
    } else {
      existingPresets.push(newPreset);
    }

    try {
      await Preferences.set({
        key: UserPreference.VOLUME_PRESETS,
        value: JSON.stringify(existingPresets)
      });
      return existingPresets;
    } catch (error) {
      console.error('VolumePresetsService: Failed to save preset to user preferences', error);
      throw error;
    }
  }

  async applyPreset(preset: VolumePreset): Promise<void> {
    for (const client of preset.data) {
      try {
        await this.snapcastService.smoothClientVolumeTransition(client.clientId, client.volumePercent).toPromise();
        console.log(`Applied volume ${client.volumePercent}% to client ${client.clientId}`);
      } catch (error) {
        console.error(`VolumePresetsService: Failed to apply volume for client ${client.clientId}`, error);
      }
    }
  }

  async deletePreset(preset: VolumePreset): Promise<VolumePreset[]> {
    let existingPresets = await this.loadPresetsFromPreferences();
    existingPresets = existingPresets.filter((p: VolumePreset) => p.id !== preset.id);
    try {
      await Preferences.set({
        key: UserPreference.VOLUME_PRESETS,
        value: JSON.stringify(existingPresets)
      });
      return existingPresets;
    } catch (error) {
      console.error(`VolumePresetsService: Failed to delete preset "${preset.presetName}" from user preferences`, error);
      throw error;
    }
  }
}
