import { TestBed } from '@angular/core/testing';

import { BleWifiProvisioningService } from './ble-wifi-provisioning.service';

describe('BleWifiProvisioningService', () => {
  let service: BleWifiProvisioningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BleWifiProvisioningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
