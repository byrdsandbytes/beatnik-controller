export interface SnapCastServerStatusResponse {
  server: Server
}

export interface Server {
  groups: Group[]
  server: ServerDetail
  streams: Stream[]
}

export interface Group {
  clients: Client[]
  id: string
  muted: boolean
  name: string
  stream_id: string
}

export interface Client {
  config: Config
  connected: boolean
  host: Host
  id: string
  lastSeen: LastSeen
  snapclient: Snapclient
}

export interface Config {
  instance: number
  latency: number
  name: string
  volume: Volume
}

export interface Volume {
  muted: boolean
  percent: number
}

export interface Host {
  arch: string
  ip: string
  mac: string
  name: string
  os: string
}

export interface LastSeen {
  sec: number
  usec: number
}

export interface Snapclient {
  name: string
  protocolVersion: number
  version: string
}

export interface ServerDetail {
  host: HostDetail
  snapserver: Snapserver
}

export interface HostDetail {
  arch: string
  ip: string
  mac: string
  name: string
  os: string
}

export interface Snapserver {
  controlProtocolVersion: number
  name: string
  protocolVersion: number
  version: string
}

export interface Stream {
  id: string
  properties: Properties
  status: string
  uri: Uri
}

export interface Properties {
  canControl: boolean
  canGoNext: boolean
  canGoPrevious: boolean
  canPause: boolean
  canPlay: boolean
  canSeek: boolean
  metadata: Metadata
}

export interface Metadata {
  album: string
  artData: ArtData
  artUrl: string
  artist: string[]
  title: string
}

export interface ArtData {
  data: string
  extension: string
}

export interface Uri {
  fragment: string
  host: string
  path: string
  query: Query
  raw: string
  scheme: string
}

export interface Query {
  chunk_ms: string
  codec: string
  name: string
  port?: string
  sampleformat: string
  devicename?: string

}


// --- Stream Control Types ---
export type StreamControlCommandType =
  | 'play'
  | 'pause'
  | 'playPause'
  | 'stop'
  | 'next'
  | 'previous'
  | 'seek'
  | 'setPosition';

export interface StreamControlSeekParams {
  offset: number; // float, in seconds
}

export interface StreamControlSetPositionParams {
  position: number; // float, in seconds
}

// Union for parameters specific to seek/setPosition commands
export type StreamControlCommandSpecificParams = StreamControlSeekParams | StreamControlSetPositionParams;

// Parameters for the Stream.Control RPC method
export interface StreamControlRpcPayloadParams {
  id: string; // The ID of the stream to control
  command: StreamControlCommandType;
  params?: StreamControlCommandSpecificParams; // Only for 'seek' or 'setPosition'
}

// --- Stream SetProperty Types ---
export type StreamLoopStatus = 'none' | 'track' | 'playlist';

// Parameters for the Stream.SetProperty RPC method
export interface StreamSetPropertyRpcPayloadParams {
  id: string; // The ID of the stream
  property: string; // The name of the property to set
  value: any; // The value for the property
}
