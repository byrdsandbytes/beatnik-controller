// src/app/services/zeroconf.service.ts

import { Injectable, OnDestroy, NgZone } from '@angular/core';
// @ts-ignore
import { ZeroConf, ZeroConfService, ZeroConfWatchResult } from 'capacitor-zeroconf';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, scan } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ZeroconfService implements OnDestroy {
  private readonly servicesSubject = new BehaviorSubject<ZeroConfService[]>([]);
  
  // Expose the list of services as an observable
  public readonly services$: Observable<ZeroConfService[]> = this.servicesSubject.asObservable();

  constructor(private ngZone: NgZone) {
    // Listen for discovery events and update the services list
    ZeroConf.addListener('discover', (result: any) => {
      this.ngZone.run(() => {
        console.log('[ZeroConf] Discover event:', result);
        this.handleDiscoveryEvent(result);
      });
    });
  }

  private handleDiscoveryEvent(result: ZeroConfWatchResult) {
    const currentServices = this.servicesSubject.getValue();
    const service = result.service;
    
    switch (result.action) {
      case 'added':
        // The service has been discovered but not yet resolved.
        // We don't add it to the public list yet. We can log it for debugging.
        console.log('[ZeroConf] Service added (unresolved):', service.name);
        break;
      case 'resolved':
        // The service is now resolved with an IP address and port.
        // Now we can add or update it in our list.
        const existingIndex = currentServices.findIndex(s => s.name === service.name && s.type === service.type);
        if (existingIndex > -1) {
          currentServices[existingIndex] = service;
          this.servicesSubject.next([...currentServices]);
        } else {
          this.servicesSubject.next([...currentServices, service]);
        }
        break;
      case 'removed':
        // Remove the service from the list
        const filteredServices = currentServices.filter(s => s.name !== service.name || s.type !== service.type);
        this.servicesSubject.next(filteredServices);
        break;
    }
  }

  // Start watching for a specific service type
  async watch(type: string, domain = 'local.') {
    // Clear previous results before starting a new watch
    this.servicesSubject.next([]);
    console.log(`[ZeroConf] Watching for type: ${type}`);
    await ZeroConf.watch({ type, domain });
  }

  // Publish a new service
  // async publish(service: { type: string; name: string; port: number; props?: { [key: string]: string; } }) {
  //   await ZeroConf.register(service);
  //   console.log('[ZeroConf] Service published:', service.name);
  // }

  // // Unpublish a service
  // async unpublish(service: { type: string; name: string }) {
  //   await ZeroConf.unregister(service);
  //   console.log('[ZeroConf] Service unpublished:', service.name);
  // }

  // Stop all operations and clean up
  async stop() {
    await ZeroConf.stop();
    await ZeroConf.close();
    this.servicesSubject.next([]); // Clear the list
    console.log('[ZeroConf] Stopped all operations.');
  }

  // Angular's OnDestroy lifecycle hook for cleanup
  ngOnDestroy() {
    this.stop();
    // ZeroConf.removeAllListeners();
  }
}