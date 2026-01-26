import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BleWifiProvisioningPage } from './ble-wifi-provisioning.page';

describe('BleWifiProvisioningPage', () => {
  let component: BleWifiProvisioningPage;
  let fixture: ComponentFixture<BleWifiProvisioningPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BleWifiProvisioningPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
