import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreamPresetsPage } from './stream-presets.page';

describe('StreamPresetsPage', () => {
  let component: StreamPresetsPage;
  let fixture: ComponentFixture<StreamPresetsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StreamPresetsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
