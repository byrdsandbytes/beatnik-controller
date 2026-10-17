import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BeatnikUpdatePage } from './beatnik-update.page';

describe('BeatnikUpdatePage', () => {
  let component: BeatnikUpdatePage;
  let fixture: ComponentFixture<BeatnikUpdatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BeatnikUpdatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
