import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SnapcastStreamPreviewComponent } from './snapcast-stream-preview.component';

describe('SnapcastStreamPreviewComponent', () => {
  let component: SnapcastStreamPreviewComponent;
  let fixture: ComponentFixture<SnapcastStreamPreviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SnapcastStreamPreviewComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SnapcastStreamPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
