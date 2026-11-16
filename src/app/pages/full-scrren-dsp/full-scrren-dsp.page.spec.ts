import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FullScrrenDspPage } from './full-scrren-dsp.page';

describe('FullScrrenDspPage', () => {
  let component: FullScrrenDspPage;
  let fixture: ComponentFixture<FullScrrenDspPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FullScrrenDspPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
