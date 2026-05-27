import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SnapcastService } from './snapcast.service';
import { Preferences } from '@capacitor/preferences';
import { UserPreference } from '../enum/user-preference.enum';
import { StreamPreset } from '../model/stream-presets.model';

@Injectable({
  providedIn: 'root'
})
export class StreamPresetsService {

  constructor(private snapcastService: SnapcastService) { }

  async capturePreset(): Promise<StreamPreset | null> {
    const currentState = await firstValueFrom(this.snapcastService.getServerStatus());
    if (!currentState || !currentState.server) {
      console.error('StreamPresetsService: Failed to capture preset - invalid server state', currentState);
      return null;
    }
    
    const presetData = currentState.server.groups.map((group: any) => ({
      groupId: group.id,
      groupName: group.name || '',
      streamId: group.stream_id
    }));

    return { 
      id: crypto.randomUUID(), 
      presetName: 'Stream Preset ' + new Date().toISOString().replace(/[:.]/g, '-'), 
      data: presetData 
    };
  }

  async loadPresetsFromPreferences(): Promise<StreamPreset[]> {
    try {
      const result = await Preferences.get({ key: UserPreference.STREAM_PRESETS });
      if (result.value) {
        let presets = JSON.parse(result.value);
        let presetArray = Array.isArray(presets) ? presets : [presets];
        let needsMigration = false;
        
        let migratedArray = presetArray.map((p: any) => {
          if (!p.id) {
            p.id = crypto.randomUUID();
            needsMigration = true;
          }
          return p as StreamPreset;
        });

        if (needsMigration) {
          await Preferences.set({
            key: UserPreference.STREAM_PRESETS,
            value: JSON.stringify(migratedArray)
          });
        }
        
        return migratedArray;
      }
    } catch (error) {
      console.error('StreamPresetsService: Failed to load preset from user preferences', error);
    }
    return [];
  }

  async savePreset(newPreset: StreamPreset): Promise<StreamPreset[]> {
    const existingPresets = await this.loadPresetsFromPreferences();
    const existingIndex = existingPresets.findIndex((p: StreamPreset) => p.id === newPreset.id);
    
    if (existingIndex >= 0) {
      existingPresets[existingIndex] = newPreset;
    } else {
      existingPresets.push(newPreset);
    }

    try {
      await Preferences.set({
        key: UserPreference.STREAM_PRESETS,
        value: JSON.stringify(existingPresets)
      });
      return existingPresets;
    } catch (error) {
      console.error('StreamPresetsService: Failed to save preset to user preferences', error);
      throw error;
    }
  }

  async applyPreset(preset: StreamPreset): Promise<void> {
    for (const group of preset.data) {
      try {
        await firstValueFrom(this.snapcastService.setGroupStream(group.groupId, group.streamId));
        console.log(`Applied stream ${group.streamId} to group ${group.groupId}`);
      } catch (error) {
        console.error(`StreamPresetsService: Failed to apply stream for group ${group.groupId}`, error);
      }
    }
  }

  async deletePreset(preset: StreamPreset): Promise<StreamPreset[]> {
    let existingPresets = await this.loadPresetsFromPreferences();
    existingPresets = existingPresets.filter((p: StreamPreset) => p.id !== preset.id);
    try {
      await Preferences.set({
        key: UserPreference.STREAM_PRESETS,
        value: JSON.stringify(existingPresets)
      });
      return existingPresets;
    } catch (error) {
      console.error(`StreamPresetsService: Failed to delete preset "${preset.presetName}" from user preferences`, error);
      throw error;
    }
  }
}

