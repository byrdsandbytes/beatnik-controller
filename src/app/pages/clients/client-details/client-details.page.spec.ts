import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientDetailsPage } from './client-details.page';

describe('ClientDetailsPage', () => {
  let component: ClientDetailsPage;
  let fixture: ComponentFixture<ClientDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
