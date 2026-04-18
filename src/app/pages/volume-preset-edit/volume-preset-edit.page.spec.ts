import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VolumePresetEditPage } from './volume-preset-edit.page';

describe('VolumePresetEditPage', () => {
  let component: VolumePresetEditPage;
  let fixture: ComponentFixture<VolumePresetEditPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VolumePresetEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
