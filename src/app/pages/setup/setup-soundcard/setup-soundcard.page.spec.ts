import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetupSoundcardPage } from './setup-soundcard.page';

describe('SetupSoundcardPage', () => {
  let component: SetupSoundcardPage;
  let fixture: ComponentFixture<SetupSoundcardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupSoundcardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
