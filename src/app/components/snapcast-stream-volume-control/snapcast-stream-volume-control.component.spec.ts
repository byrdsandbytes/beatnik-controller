import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SnapcastStreamVolumeControlComponent } from './snapcast-stream-volume-control.component';

describe('SnapcastStreamVolumeControlComponent', () => {
  let component: SnapcastStreamVolumeControlComponent;
  let fixture: ComponentFixture<SnapcastStreamVolumeControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SnapcastStreamVolumeControlComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SnapcastStreamVolumeControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
