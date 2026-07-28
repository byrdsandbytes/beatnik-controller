import { Injectable } from '@angular/core';
import { mDNS, MdnsBroadcastOptions, MdnsBroadcastResult, MdnsDiscoverOptions, MdnsDiscoverResult, MdnsStopResult, MdnsPluginPlatformResult } from '@byrds/capacitor-mdns';

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
}
