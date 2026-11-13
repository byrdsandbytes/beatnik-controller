import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';

import { BeatnikDeviceUpdateComponent } from './beatnik-device-update.component';

describe('BeatnikDeviceUpdateComponent', () => {
  let component: BeatnikDeviceUpdateComponent;
  let fixture: ComponentFixture<BeatnikDeviceUpdateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BeatnikDeviceUpdateComponent ],
      imports: [IonicModule.forRoot(), FormsModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(BeatnikDeviceUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
