import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetupDeviceGroupNamePage } from './setup-device-group-name.page';

describe('SetupDeviceGroupNamePage', () => {
  let component: SetupDeviceGroupNamePage;
  let fixture: ComponentFixture<SetupDeviceGroupNamePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupDeviceGroupNamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
