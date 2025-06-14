import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServerStatusPage } from './server-status.page';

describe('ServerStatusPage', () => {
  let component: ServerStatusPage;
  let fixture: ComponentFixture<ServerStatusPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
