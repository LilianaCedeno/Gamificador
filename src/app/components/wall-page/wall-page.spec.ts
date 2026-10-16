import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WallPage } from './wall-page';

describe('WallPage', () => {
  let component: WallPage;
  let fixture: ComponentFixture<WallPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WallPage],
    }).compileComponents();

    fixture = TestBed.createComponent(WallPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
