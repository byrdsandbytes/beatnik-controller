import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreamDetailsPage } from './stream-details.page';

describe('StreamDetailsPage', () => {
  let component: StreamDetailsPage;
  let fixture: ComponentFixture<StreamDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StreamDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
