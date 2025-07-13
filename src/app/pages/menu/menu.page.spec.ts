import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuPage } from './menu.page';

describe('MenuPage', () => {
  let component: MenuPage;
  let fixture: ComponentFixture<MenuPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
