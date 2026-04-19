export interface VolumePresetData {
  clientId: string;
  volumePercent: number;
  groupId: string;
  groupName: string;
}

export interface VolumePreset {
  presetName: string;
  presetDescription?: string;
  data: VolumePresetData[];
}
