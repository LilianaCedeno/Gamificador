import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemporalFooter } from './temporal.footer';

describe('TemporalFooter', () => {
  let component: TemporalFooter;
  let fixture: ComponentFixture<TemporalFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemporalFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(TemporalFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
