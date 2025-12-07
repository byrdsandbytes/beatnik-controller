import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BleWifiSetupPage } from './ble-wifi-setup.page';

describe('BleWifiSetupPage', () => {
  let component: BleWifiSetupPage;
  let fixture: ComponentFixture<BleWifiSetupPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BleWifiSetupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
