import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { SignalLevelBarsComponent } from './signal-level-bars.component';

describe('SignalLevelBarsComponent', () => {
  let component: SignalLevelBarsComponent;
  let fixture: ComponentFixture<SignalLevelBarsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SignalLevelBarsComponent ],
      imports: [IonicModule.forRoot(), CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SignalLevelBarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
