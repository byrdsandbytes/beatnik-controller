import { Injectable } from '@angular/core';
import { ClientOnConnect, ClientOnDisconnect, ClientVolumeChange, GroupMuteChange, GroupNameChange, GroupStreamChange, ServerOnUpdate, SnapcastWebsocketNotification, StreamOnProperties, StreamOnUpdate } from '../model/snapcast-websocket-notification.model';
import { Client, SnapCastServerStatusResponse } from '../model/snapcast.model';

@Injectable({
  providedIn: 'root'
})
export class SnapcastWebsocketNotificationService {

  constructor() { }

  async handleNotification(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    console.log('Handling WebSocket notification:', message);
    switch (message.method) {
      case 'Client.OnVolumeChanged':
        return await this.handleClientVolumeChange(message, currentStatus);
      case 'Client.OnConnect':
        return await this.handleClientConnectionStatusChange(message, currentStatus);
      case 'Client.OnDisconnect':
        return await this.handleClientConnectionStatusChange(message, currentStatus);
      case 'Stream.OnProperties':
        return await this.handleStreamPropertiesChange(message, currentStatus);
      case 'Stream.OnUpdate':
        return await this.handleStreamUpdate(message, currentStatus);
      case 'Group.OnMute':
        return await this.handleGroupMuteChange(message, currentStatus);
      case 'Group.OnStreamChanged':
        return await this.handleGroupStreamChange(message, currentStatus);
      case 'Group.OnNameChanged':
        return await this.handleGroupNameChange(message, currentStatus);
      case 'Server.OnUpdate':
        return await this.handleServerUpdate(message, currentStatus);
      default:
        console.warn(`Unhandled notification method: ${message.method}`);
        return currentStatus; // Return the current status if no handling is done
    }

  }

  async handleClientVolumeChange(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as ClientVolumeChange
    const clientId = params.id;
    const volume = params.volume;  
    currentStatus.server.groups.forEach(group => {
      group.clients.forEach(c => {
        if (c.id === clientId) {
          c.config.volume = volume; // Update the client's volume
        }
      });
    });

    console.log(`Updated volume for client ${clientId}:`, volume);
    console.log('Current Status:', currentStatus);

    return currentStatus; // Return the updated status
  }

  async handleClientConnectionStatusChange(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as ClientOnConnect | ClientOnDisconnect;
    const client = params.client as Client;
    const clientId = client.id;
    return currentStatus; // Return the current status for now, as we are not modifying it yet
    // TODO 
    
  }

  async handleStreamPropertiesChange(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as StreamOnProperties;
    const streamId = params.id;
    const properties = params.properties;
    // Find the stream in the current status
   currentStatus.server.streams.forEach(s => {
      if (s.id === streamId) {
        // Update the stream properties
        console.log(`Updated properties for stream ${streamId}:`, properties);
        s.properties = properties; // Ensure properties are updated
        console.log('Current Status:', currentStatus);
      }
    }
    );
    return currentStatus; // Return the updated status
  }

  async handleStreamUpdate(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as StreamOnUpdate;
    const streamId = params.id;
    const stream = params.stream;
    // Find the stream in the current status
    const existingStream = currentStatus.server.streams.find(s => s.id === streamId);
    if (existingStream) {
      // Update the existing stream
      Object.assign(existingStream, stream);
      console.log(`Updated stream ${streamId}:`, stream);
    }
    else {
      // Add the new stream if it doesn't exist
      currentStatus.server.streams.push(stream);
      console.log(`Added new stream ${streamId}:`, stream);
    }
    return currentStatus; // Return the updated status
  }

  async handleGroupMuteChange(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as GroupMuteChange;
    const groupId = params.id;
    const muted = params.mute;
    // Find the group in the current status
    const group = currentStatus.server.groups.find(g => g.id === groupId);
    if (group) {
      // Update the group's muted status
      group.muted = muted;
      console.log(`Updated mute status for group ${groupId}:`, muted);
    }
    else {
      console.warn(`Group ${groupId} not found in current status.`);
    }
    return currentStatus; // Return the updated status
  }

  async handleGroupStreamChange(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as GroupStreamChange;
    const groupId = params.id;
    const streamId = params.stream_id;
    // Find the group in the current status
    const group = currentStatus.server.groups.find(g => g.id === groupId);
    if (group) {
      // Update the group's stream ID
      group.stream_id = streamId;
      console.log(`Updated stream ID for group ${groupId}:`, streamId);
    }
    else {
      console.warn(`Group ${groupId} not found in current status.`);
    }
    return currentStatus; // Return the updated status
  }

  async handleGroupNameChange(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as GroupNameChange;
    const groupId = params.id;
    const name = params.name;
    // Find the group in the current status
    const group = currentStatus.server.groups.find(g => g.id === groupId);
    if (group) {
      // Update the group's name
      group.name = name;
      console.log(`Updated name for group ${groupId}:`, name);
    }
    else {
      console.warn(`Group ${groupId} not found in current status.`);
    }
    return currentStatus; // Return the updated status
  }

  async handleServerUpdate(message: SnapcastWebsocketNotification, currentStatus: SnapCastServerStatusResponse): Promise<SnapCastServerStatusResponse> {
    const params = message.params as ServerOnUpdate;
    // Update the server status with the new parameters
    Object.assign(currentStatus.server, params);
    console.log(`Updated server status:`, params);
    return currentStatus; // Return the updated status
  }


}
