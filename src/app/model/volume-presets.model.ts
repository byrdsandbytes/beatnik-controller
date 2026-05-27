export interface VolumePresetData {
  clientId: string;
  volumePercent: number;
  groupId: string;
  groupName: string;
}

export interface VolumePreset {
  id: string;
  presetName: string;
  presetDescription?: string;
  data: VolumePresetData[];
}
