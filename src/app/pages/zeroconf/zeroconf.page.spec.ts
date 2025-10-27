import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZeroconfPage } from './zeroconf.page';

describe('ZeroconfPage', () => {
  let component: ZeroconfPage;
  let fixture: ComponentFixture<ZeroconfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ZeroconfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
