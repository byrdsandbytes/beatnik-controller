import { Injectable } from '@angular/core';
import {
  mDNS,
  MdnsBroadcastOptions,
  MdnsBroadcastResult,
  MdnsDiscoverOptions,
  MdnsDiscoverResult,
  MdnsStopResult,
  MdnsPluginPlatformResult,
  MdnsWatchOptions,
  MdnsWatchResult,
  MdnsServiceEvent
} from '@byrds/capacitor-mdns';
import { PluginListenerHandle } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class CapMdnsService {

  constructor() { }

  /**
   * Return the platform implementation currently serving plugin calls.
   */
  async getPluginPlatform(): Promise<MdnsPluginPlatformResult> {
    return await mDNS.getPluginPlatform();
  }

  /**
   * Start advertising a Bonjour/mDNS service.
   */
  async startBroadcast(options: MdnsBroadcastOptions): Promise<MdnsBroadcastResult> {
    return await mDNS.startBroadcast(options);
  }

  /**
   * Stop advertising the currently registered service.
   */
  async stopBroadcast(): Promise<MdnsStopResult> {
    return await mDNS.stopBroadcast();
  }

  /**
   * Discover services of a given type and optionally filter by instance name.
   */
  async discover(options?: MdnsDiscoverOptions): Promise<MdnsDiscoverResult> {
    return await mDNS.discover(options);
  }

  /**
   * Start watching multiple service types simultaneously.
   */
  async watchServices(options: MdnsWatchOptions): Promise<MdnsWatchResult> {
    return await mDNS.watchServices(options);
  }

  /**
   * Stop watching services.
   */
  async stopWatching(): Promise<MdnsStopResult> {
    return await mDNS.stopWatching();
  }

  /**
   * Add a listener for mDNS events ('serviceFound' | 'serviceLost').
   */
  addListener(
    eventName: 'serviceFound',
    handler: (event: MdnsServiceEvent) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'serviceLost',
    handler: (event: MdnsServiceEvent) => void
  ): Promise<PluginListenerHandle>;
  async addListener(
    eventName: 'serviceFound' | 'serviceLost',
    handler: (event: MdnsServiceEvent) => void
  ): Promise<PluginListenerHandle> {
    if (eventName === 'serviceFound') {
      return await mDNS.addListener('serviceFound', handler);
    }
    return await mDNS.addListener('serviceLost', handler);
  }
}
