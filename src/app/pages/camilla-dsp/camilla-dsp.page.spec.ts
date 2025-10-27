import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CamillaDspPage } from './camilla-dsp.page';

describe('CamillaDspPage', () => {
  let component: CamillaDspPage;
  let fixture: ComponentFixture<CamillaDspPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CamillaDspPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
