import { Client, Properties, Server, Stream, Volume } from "./snapcast.model";



export interface SnapcastWebsocketNotification {
    jsonrpc: string
    method:
    | 'Stream.OnProperties'
    | 'Stream.OnUpdate'
    | 'Client.OnConnect'
    | 'Client.OnDisconnect'
    | 'Client.OnVolumeChanged'
    | 'Client.OnLatencyChanged'
    | 'Client.OnNameChanged'
    | 'Group.OnMute'
    | 'Group.OnStreamChanged'
    | 'Group.OnNameChanged'
    | 'Server.OnUpdate';
    params:
    | StreamOnProperties
    | StreamOnUpdate
    | ClientOnConnect
    | ClientOnDisconnect
    | ClientVolumeChange
    | ClientLatencyChange
    | ClientNameChange
    | GroupMuteChange
    | GroupStreamChange
    | GroupNameChange
    | ServerOnUpdate;
}

// Stream Notifications
export interface StreamOnProperties {
    id: string;
    properties: Properties;
}

export interface StreamOnUpdate {
    id: string;
    stream: Stream;
}



// Client Notifications
export interface ClientOnConnect {
    client: Client;
    id: string;
}

export interface ClientOnDisconnect {
    client: Client;
    id: string;
}

export interface ClientVolumeChange {
    id: string;
    volume: Volume;
}

export interface ClientLatencyChange {
    id: string;
    latency: number;
}

export interface ClientNameChange {
    id: string;
    name: string;
}

// Group Notifications
export interface GroupMuteChange {
    id: string;
    mute: boolean;
}

export interface GroupStreamChange {
    id: string;
    stream_id: string;
}

export interface GroupNameChange {
    id: string;
    name: string;
}

// Server Notifications
export interface ServerOnUpdate {
    server: Server;
}


