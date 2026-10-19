import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Dashboard } from './dashboard';
import { ColaboradorDataService, type DashboardColaborador } from '../../../core/data-access/colaborador-data.service';
import { firstValueFrom } from 'rxjs';

describe('Dashboard Colaborador', () => {
  let datos: DashboardColaborador;
  beforeEach(async () => { datos = await firstValueFrom(new ColaboradorDataService().cargar()); });
  function preparar(cargar = vi.fn().mockReturnValue(of(datos))) {
    const reconocer = vi.fn().mockReturnValue(of(datos));
    TestBed.configureTestingModule({ providers: [{ provide: ColaboradorDataService, useValue: { cargar, reconocer } }] });
    const f = TestBed.createComponent(Dashboard);
    f.detectChanges();
    return { f, cargar, reconocer };
  }
  it('presenta las secciones en el orden aprobado y métricas coherentes', () => {
    const { f } = preparar();
    const html = f.nativeElement as HTMLElement;
    expect(html.textContent).toContain('IMPULSA');
    expect(html.textContent).toContain('Ana Ejemplo');
    expect(html.textContent).toContain('4 años, 7 meses y 4 días');
    expect(Array.from(html.querySelectorAll('main section')).map(s => s.getAttribute('aria-labelledby'))).toEqual(['titulo-perfil', 'titulo-insignias', 'titulo-avances', 'titulo-historial']);
    expect(html.querySelectorAll('app-insignia-card')).toHaveLength(5);
    expect(f.componentInstance.estrellas).toBe(27);
    expect(html.querySelectorAll('.metricas strong')[2].textContent).toBe('+13');
  });
  it('presenta carga, error y reintento exitoso', () => {
    const respuesta = new Subject<DashboardColaborador>();
    const cargar = vi.fn().mockReturnValueOnce(respuesta).mockReturnValueOnce(throwError(() => new Error())).mockReturnValue(of(datos));
    const { f } = preparar(cargar);
    expect(f.nativeElement.textContent).toContain('Cargando tu espacio');
    respuesta.next(datos);
    f.detectChanges();
    f.componentInstance.cargar('error');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    (f.nativeElement.querySelector('.aviso button') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana Ejemplo');
  });
  it('abre, envía y cierra el formulario con confirmación accesible', () => {
    const { f, reconocer } = preparar();
    f.nativeElement.querySelector('#abrir-reconocer').click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('app-reconocimiento-form')).toBeTruthy();
    f.componentInstance.enviar({ destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: 'Gracias', evidencias: [] });
    f.detectChanges();
    expect(reconocer).toHaveBeenCalledTimes(1);
    expect(f.nativeElement.querySelector('app-reconocimiento-form')).toBeNull();
    expect(f.nativeElement.querySelector('[role="status"]').textContent).toContain('Quedó pendiente de People');
  });
  it('mantiene el formulario ante un error de envío y permite reintentar', () => {
    const { f, reconocer } = preparar();
    reconocer.mockReturnValue(throwError(() => new Error()));
    f.componentInstance.abrirFormulario();
    f.componentInstance.enviar({ destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: 'Gracias', evidencias: [] });
    f.detectChanges();
    expect(f.componentInstance.enviando()).toBe(false);
    expect(f.nativeElement.querySelector('app-reconocimiento-form')).toBeTruthy();
    expect(f.nativeElement.querySelector('[role="alert"]').textContent).toContain('No se pudo enviar');
  });

  it('muestra el dashboard vacío con cinco categorías en cero', async () => {
    datos = await firstValueFrom(new ColaboradorDataService().cargar('vacio'));
    const { f } = preparar();
    expect(f.nativeElement.querySelectorAll('.medalla')).toHaveLength(5);
    expect(f.nativeElement.querySelectorAll('progress')).toHaveLength(5);
    expect(f.componentInstance.estrellas).toBe(0);
    expect(f.nativeElement.textContent).toContain('No hay reconocimientos recibidos');
  });

  it('integra formulario, servicio real e historial de enviados sin sumar estrellas', async () => {
    const f = TestBed.createComponent(Dashboard);
    f.detectChanges();
    await vi.waitFor(() => expect(f.componentInstance.datos()).not.toBeNull());
    f.detectChanges();
    f.nativeElement.querySelector('#abrir-reconocer').click();
    f.detectChanges();
    const html = f.nativeElement as HTMLElement;
    const completar = (selector: string, valor: string, evento: string) => {
      const control = html.querySelector(selector) as HTMLInputElement;
      control.value = valor;
      control.dispatchEvent(new Event(evento, { bubbles: true }));
    };
    completar('#destinatario', 'col-2', 'change');
    completar('#categoria', 'mentorias', 'change');
    completar('#motivo', 'Gracias por compartir tus conocimientos', 'input');
    html.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(f.componentInstance.mensaje()).toContain('Quedó pendiente'));
    f.detectChanges();
    const botones = Array.from(html.querySelectorAll('app-historial button')) as HTMLButtonElement[];
    botones.find(b => b.textContent?.includes('Enviados'))!.click();
    f.detectChanges();
    expect(html.querySelector('app-historial')!.textContent).toContain('Gracias por compartir tus conocimientos');
    expect(html.querySelector('app-historial')!.textContent).toContain('Pendiente');
    expect(f.componentInstance.estrellas).toBe(27);
  });
});
