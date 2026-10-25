import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  let component: LandingPage;
  let fixture: ComponentFixture<LandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('presenta la bienvenida y conserva las acciones de acceso', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const ingresar = compiled.querySelector('.landing-button-primary') as HTMLButtonElement;
    const acerca = compiled.querySelector('.landing-button-secondary') as HTMLButtonElement;
    const abrirLogin = vi.spyOn(component, 'abrirLogin');
    const abrirAbout = vi.spyOn(component, 'abrirAbout');

    expect(compiled.querySelector('h1')?.textContent).toContain('Inspirate');
    expect(compiled.querySelector('.landing-description')?.textContent).toContain('reconocer cada aporte');
    expect(ingresar.textContent).toContain('Ingresar');
    expect(acerca.textContent).toContain('Acerca de');

    ingresar.click();
    acerca.click();
    expect(abrirLogin).toHaveBeenCalledOnce();
    expect(abrirAbout).toHaveBeenCalledOnce();
  });
});
