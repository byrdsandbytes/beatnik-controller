import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SnapcastGroupPreviewComponent } from './snapcast-group-preview.component';

describe('SnapcastGroupPreviewComponent', () => {
  let component: SnapcastGroupPreviewComponent;
  let fixture: ComponentFixture<SnapcastGroupPreviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SnapcastGroupPreviewComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SnapcastGroupPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
