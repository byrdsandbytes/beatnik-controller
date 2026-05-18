import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreamPresetEditPage } from './stream-preset-edit.page';

describe('StreamPresetEditPage', () => {
  let component: StreamPresetEditPage;
  let fixture: ComponentFixture<StreamPresetEditPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StreamPresetEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
