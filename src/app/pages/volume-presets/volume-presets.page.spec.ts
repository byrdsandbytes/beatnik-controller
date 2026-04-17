import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VolumePresetsPage } from './volume-presets.page';

describe('VolumePresetsPage', () => {
  let component: VolumePresetsPage;
  let fixture: ComponentFixture<VolumePresetsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VolumePresetsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
