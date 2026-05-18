export interface StreamPresetData {
  groupId: string;
  groupName: string;
  streamId: string;
}

export interface StreamPreset {
  id: string;
  presetName: string;
  presetDescription?: string;
  data: StreamPresetData[];
}