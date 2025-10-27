import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetupServerPage } from './setup-server.page';

describe('SetupServerPage', () => {
  let component: SetupServerPage;
  let fixture: ComponentFixture<SetupServerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupServerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
