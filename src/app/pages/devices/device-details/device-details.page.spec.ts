import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviceDetailsPage } from './device-details.page';

describe('DeviceDetailsPage', () => {
  let component: DeviceDetailsPage;
  let fixture: ComponentFixture<DeviceDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
