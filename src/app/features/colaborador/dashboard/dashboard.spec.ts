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
    expect(Array.from(html.querySelectorAll('section')).map(s => s.getAttribute('aria-labelledby'))).toEqual(['titulo-perfil', 'titulo-insignias', 'titulo-historial', 'titulo-avances']);
    expect(html.querySelectorAll('app-insignia-card')).toHaveLength(5);
    expect(html.querySelector('main')!.firstElementChild).toBe(html.querySelector('#insignias'));
    expect(html.querySelector('.encabezados')!.firstElementChild).toBe(html.querySelector('.cabecera'));
    expect(html.querySelector('.cabecera')!.nextElementSibling).toBe(html.querySelector('.perfil'));
    expect(html.querySelector('.encabezados')!.nextElementSibling).toBe(html.querySelector('main'));
    expect(Array.from(html.querySelector('.paneles')!.children).map(n => n.id)).toEqual(['historial', 'avances']);
    expect(html.querySelectorAll('.paneles > .panel.imp-card')).toHaveLength(2);
    for (const panel of html.querySelectorAll('.paneles > .panel')) {
      expect(panel.firstElementChild?.tagName).toBe('H2');
      expect(panel.querySelectorAll(':scope > h2')).toHaveLength(1);
    }
    const encabezadoComun = html.querySelector('#titulo-aportes')!;
    expect(encabezadoComun.textContent).toBe('APORTES QUE DEJAN HUELLA');
    expect(html.querySelectorAll('#titulo-aportes')).toHaveLength(1);
    expect(encabezadoComun.nextElementSibling).toBe(html.querySelector('.paneles'));
    expect(html.querySelector('.paneles')!.getAttribute('aria-labelledby')).toBe('titulo-aportes');
    expect(html.querySelector('#historial #titulo-aportes')).toBeNull();
    expect(html.querySelector('#historial')!.firstElementChild).toBe(html.querySelector('#titulo-historial'));
    expect(html.querySelector('#titulo-historial')!.nextElementSibling?.tagName.toLowerCase()).toBe('app-historial');
    expect(html.querySelectorAll('#avances .metricas article')).toHaveLength(3);
    expect(html.querySelector('#historial app-historial .filtros')).toBeTruthy();
    expect(html.querySelector('#historial .historial')!.getAttribute('tabindex')).toBe('0');
    expect(html.textContent).not.toContain('Mi espacio de logros');
    expect(html.textContent).not.toContain('Cada aporte cuenta. Descubre cómo vas avanzando');
    expect(html.querySelectorAll('#titulo-perfil')).toHaveLength(1);
    expect(html.querySelector('h1')!.textContent).toBe('Ana Ejemplo');
    expect(Array.from(html.querySelectorAll('.datos-perfil dt')).map(n => n.textContent)).toEqual(['Antigüedad', 'Fecha de ingreso', 'Identificación interna']);
    expect(html.querySelector('.perfil')!.textContent).toContain('15/03/2022');
    expect(html.querySelector('.perfil')!.textContent).toContain('DEMO-001');
    expect(html.querySelector('.perfil a')!.getAttribute('href')).toBe('mailto:ana@example.invalid');
    expect(html.querySelectorAll('app-insignia-card img[medalla]')).toHaveLength(3);
    expect(html.querySelector('#historial')!.compareDocumentPosition(html.querySelector('.demo')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(f.componentInstance.estrellas).toBe(27);
    expect(html.querySelectorAll('.metricas strong')[2].textContent).toBe('+13');
  });
  it('presenta carga, error y reintento exitoso', () => {
    const respuesta = new Subject<DashboardColaborador>();
    const cargar = vi.fn().mockReturnValueOnce(respuesta).mockReturnValueOnce(throwError(() => new Error())).mockReturnValue(of(datos));
    const { f } = preparar(cargar);
    expect(f.nativeElement.textContent).toContain('Cargando tu espacio');
    expect(f.nativeElement.querySelector('#abrir-reconocer').disabled).toBe(true);
    respuesta.next(datos);
    f.detectChanges();
    f.componentInstance.cargar('error');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    (f.nativeElement.querySelector('.aviso button') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana Ejemplo');
  });
  it('muestra una sola acción de reconocimiento en la navegación y abre el formulario existente', () => {
    const { f } = preparar();
    const html = f.nativeElement as HTMLElement;
    const acciones = Array.from(html.querySelectorAll('button')).filter(b => b.textContent?.trim() === 'Reconocer a un compañero');
    expect(acciones).toHaveLength(1);
    const boton = acciones[0];
    expect(boton.closest('.cabecera')).not.toBeNull();
    expect(html.querySelector('#historial #abrir-reconocer')).toBeNull();
    expect(boton.classList.contains('imp-primary')).toBe(true);
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    boton.click();
    f.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(html.querySelectorAll('app-reconocimiento-form')).toHaveLength(1);
    expect(html.querySelector('#reconocer-panel form')).not.toBeNull();
    expect(html.querySelectorAll('#abrir-reconocer')).toHaveLength(1);
  });
  it('abre, envía y cierra el formulario con confirmación accesible', () => {
    const { f, reconocer } = preparar();
    f.nativeElement.querySelector('#abrir-reconocer').click();
    f.detectChanges();
    expect(f.nativeElement.querySelector('app-reconocimiento-form')).toBeTruthy();
    expect(f.nativeElement.querySelector('.paneles app-reconocimiento-form')).toBeNull();
    expect(f.nativeElement.querySelector('.paneles').nextElementSibling.id).toBe('reconocer-panel');
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
