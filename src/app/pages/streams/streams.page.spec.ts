import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreamsPage } from './streams.page';

describe('StreamsPage', () => {
  let component: StreamsPage;
  let fixture: ComponentFixture<StreamsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StreamsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
