import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { Dashboard } from './dashboard';
import { ColaboradorDataService, type DashboardColaborador } from '../../../core/data-access/colaborador-data.service';
import { CLAVE_TEMA_IMPULSA } from '../../../core/data-access/tema.service';

describe('Dashboard Colaborador: perfil, modal y temas', () => {
  let datos: DashboardColaborador;
  beforeEach(async () => {
    localStorage.removeItem(CLAVE_TEMA_IMPULSA);
    datos = await firstValueFrom(new ColaboradorDataService().cargar());
  });
  afterEach(() => {
    TestBed.inject(Dialog).closeAll();
    vi.restoreAllMocks();
    localStorage.removeItem(CLAVE_TEMA_IMPULSA);
  });
  function preparar(cargar = vi.fn().mockReturnValue(of(datos))) {
    const reconocer = vi.fn().mockReturnValue(of(datos));
    TestBed.configureTestingModule({ providers: [{ provide: ColaboradorDataService, useValue: { cargar, reconocer } }] });
    const f = TestBed.createComponent(Dashboard);
    f.detectChanges();
    return { f, cargar, reconocer };
  }
  async function abrir(f: ReturnType<typeof preparar>['f']) {
    const boton = f.nativeElement.querySelector('#abrir-reconocer') as HTMLButtonElement;
    boton.focus(); boton.click(); f.detectChanges();
    await f.whenStable();
    return document.querySelector('cdk-dialog-container') as HTMLElement;
  }
  function completarFormulario() {
    for (const [selector, valor, evento] of [
      ['#destinatario', 'col-2', 'change'], ['#categoria', 'mentorias', 'change'],
      ['#motivo', 'Gracias por compartir tus conocimientos', 'input'],
    ]) {
      const control = document.querySelector(selector) as HTMLInputElement;
      control.value = valor;
      control.dispatchEvent(new Event(evento, { bubbles: true }));
    }
  }
  function enviarFormulario() {
    completarFormulario();
    document.querySelector('cdk-dialog-container form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
  function escape() {
    document.querySelector('cdk-dialog-container')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }));
  }

  it('coloca el perfil en el flujo de main y mantiene cinco categorías y paneles', () => {
    const { f } = preparar();
    const html = f.nativeElement as HTMLElement;
    expect(html.querySelector('.cabecera')!.nextElementSibling).toBe(html.querySelector('main'));
    expect(html.querySelector('main')!.firstElementChild).toBe(html.querySelector('.perfil'));
    expect(html.querySelector('.cabecera .perfil')).toBeNull();
    expect(html.querySelector('.encabezados')).toBeNull();
    expect(getComputedStyle(html.querySelector('.cabecera')!).position).toBe('sticky');
    expect(getComputedStyle(html.querySelector('.perfil')!).position).not.toBe('sticky');
    expect(html.textContent).toContain('4 años, 7 meses y 4 días');
    expect(html.querySelector('.perfil')!.textContent).toContain('DEMO-001');
    expect(html.querySelectorAll('app-insignia-card')).toHaveLength(5);
    expect(html.querySelectorAll('img[medalla]')).toHaveLength(4);
    expect(html.querySelector('img[src="images/insignias/platino.png"]')).not.toBeNull();
    expect(Array.from(html.querySelector('.paneles')!.children).map(n => n.id)).toEqual(['historial', 'avances']);
    expect(html.querySelectorAll('.paneles > .panel.imp-card')).toHaveLength(2);
    expect(html.querySelector('#titulo-aportes')!.nextElementSibling).toBe(html.querySelector('.paneles'));
    expect(f.componentInstance.estrellas).toBe(55);
    expect(html.querySelectorAll('.metricas strong')[2].textContent).toBe('+39');
    expect(html.querySelector('main app-reconocimiento-form')).toBeNull();
  });

  it('presenta carga, error y reintento', () => {
    const respuesta = new Subject<DashboardColaborador>();
    const cargar = vi.fn().mockReturnValueOnce(respuesta).mockReturnValueOnce(throwError(() => new Error())).mockReturnValue(of(datos));
    const { f } = preparar(cargar);
    expect(f.nativeElement.textContent).toContain('Cargando tu espacio');
    expect(f.nativeElement.querySelector('#abrir-reconocer').disabled).toBe(true);
    respuesta.next(datos); f.detectChanges();
    f.componentInstance.cargar('error'); f.detectChanges();
    expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    f.nativeElement.querySelector('.aviso button').click(); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana Ejemplo');
  });

  it('abre una sola instancia modal accesible, bloquea scroll y atrapa el foco', async () => {
    // jsdom no calcula geometría: simulamos una página larga y controles visibles.
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2000);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(40);
    vi.spyOn(window, 'scroll').mockImplementation(() => {});
    const { f } = preparar();
    expect(f.nativeElement.querySelectorAll('#abrir-reconocer')).toHaveLength(1);
    const modal = await abrir(f);
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-labelledby')).toBe('titulo-reconocer');
    expect(modal.querySelectorAll('app-reconocimiento-form')).toHaveLength(1);
    expect(getComputedStyle(modal.querySelector('.modal-contenido')!).overflowY).toBe('auto');
    expect(f.nativeElement.querySelector('app-reconocimiento-form')).toBeNull();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('titulo-reconocer'));
    const anclas = document.querySelectorAll<HTMLElement>('.impulsa-dialog-pane .cdk-focus-trap-anchor');
    expect(anclas).toHaveLength(2);
    anclas[1].focus();
    expect(document.activeElement).toBe(modal.querySelector('[aria-label="Cerrar reconocimiento"]'));
    f.componentInstance.abrirFormulario();
    expect(document.querySelectorAll('app-reconocimiento-modal')).toHaveLength(1);
    escape(); f.detectChanges(); await f.whenStable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
  });

  it.each(['X', 'Cancelar', 'Escape'])('cierra con %s, desbloquea scroll y restaura el foco', async (accion) => {
    const { f } = preparar();
    const modal = await abrir(f);
    if (accion === 'Escape') escape();
    else if (accion === 'X') (modal.querySelector('[aria-label="Cerrar reconocimiento"]') as HTMLButtonElement).click();
    else (Array.from(modal.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Cancelar')!).click();
    f.detectChanges(); await f.whenStable();
    expect(document.querySelector('app-reconocimiento-modal')).toBeNull();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
    await vi.waitFor(() => expect(document.activeElement?.id).toBe('abrir-reconocer'));
    expect(f.componentInstance.formularioVisible()).toBe(false);
  });

  it('no cierra con backdrop ni durante envío y conserva el borrador al fallar', async () => {
    const { f, reconocer } = preparar();
    const pendiente = new Subject<DashboardColaborador>();
    reconocer.mockReturnValue(pendiente);
    const modal = await abrir(f);
    enviarFormulario(); await f.whenStable();
    expect(reconocer).toHaveBeenCalledTimes(1);
    expect((modal.querySelector('[aria-label="Cerrar reconocimiento"]') as HTMLButtonElement).disabled).toBe(true);
    escape();
    document.querySelector('.impulsa-backdrop')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('app-reconocimiento-modal')).not.toBeNull();
    pendiente.error(new Error('Fallo simulado'));
    await f.whenStable();
    expect(modal.querySelector('[role="alert"]')!.textContent).toContain('Tus datos se conservan');
    expect((modal.querySelector('#motivo') as HTMLTextAreaElement).value).toContain('Gracias');
    expect((modal.querySelector('[aria-label="Cerrar reconocimiento"]') as HTMLButtonElement).disabled).toBe(false);
    reconocer.mockReturnValue(of(datos));
    enviarFormulario(); await f.whenStable(); f.detectChanges();
    expect(reconocer).toHaveBeenCalledTimes(2);
    expect(document.querySelector('app-reconocimiento-modal')).toBeNull();
    expect(f.nativeElement.querySelector('[role="status"]').textContent).toContain('Quedó pendiente de People');
  });

  it('conserva las validaciones antes de llamar al servicio', async () => {
    const { f, reconocer } = preparar();
    const modal = await abrir(f);
    modal.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await f.whenStable();
    expect(reconocer).not.toHaveBeenCalled();
    expect(modal.querySelector('[role="alert"]')!.textContent).toContain('Selecciona un compañero');
  });

  it('parte oscuro, alterna tema y guarda una preferencia independiente de autenticación', async () => {
    const { f } = preparar(); await f.whenStable();
    const selector = f.nativeElement.querySelector('.selector-tema') as HTMLButtonElement;
    expect(f.nativeElement.querySelector('.impulsa-shell').getAttribute('data-tema')).toBe('oscuro');
    expect(selector.getAttribute('aria-label')).toBe('Activar tema claro');
    selector.click(); f.detectChanges();
    expect(f.nativeElement.querySelector('.impulsa-shell').getAttribute('data-tema')).toBe('claro');
    expect(localStorage.getItem(CLAVE_TEMA_IMPULSA)).toBe('claro');
    const modal = await abrir(f);
    expect(modal.querySelector('.impulsa-shell')!.getAttribute('data-tema')).toBe('claro');
    f.componentInstance.preferencia.alternar(); await f.whenStable();
    expect(modal.querySelector('.impulsa-shell')!.getAttribute('data-tema')).toBe('oscuro');
    expect(localStorage.getItem(CLAVE_TEMA_IMPULSA)).toBe('oscuro');
  });

  it('restaura la preferencia local al crear el dashboard', async () => {
    localStorage.setItem(CLAVE_TEMA_IMPULSA, 'claro');
    const { f } = preparar(); await f.whenStable();
    expect(f.componentInstance.preferencia.tema()).toBe('claro');
    f.componentInstance.cargar('vacio'); f.detectChanges();
    expect(f.componentInstance.preferencia.tema()).toBe('claro');
  });

  it('funciona si el almacenamiento local está bloqueado', async () => {
    const leer = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Bloqueado'); });
    const guardar = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Bloqueado'); });
    const { f } = preparar(); await f.whenStable();
    f.nativeElement.querySelector('.selector-tema').click(); f.detectChanges();
    expect(f.componentInstance.preferencia.tema()).toBe('claro');
    expect(leer).toHaveBeenCalledWith(CLAVE_TEMA_IMPULSA);
    expect(guardar).toHaveBeenCalledWith(CLAVE_TEMA_IMPULSA, 'claro');
  });

  it('admite el estado vacío con todas las categorías en cero', async () => {
    datos = await firstValueFrom(new ColaboradorDataService().cargar('vacio'));
    const { f } = preparar();
    expect(f.componentInstance.estrellas).toBe(0);
    expect(f.nativeElement.querySelectorAll('progress')).toHaveLength(5);
    expect(f.nativeElement.textContent).toContain('No hay reconocimientos recibidos');
  });

  it('integra el modal con el servicio mock y el historial de enviados', async () => {
    const f = TestBed.createComponent(Dashboard); f.detectChanges();
    await vi.waitFor(() => expect(f.componentInstance.datos()).not.toBeNull());
    f.detectChanges(); await abrir(f);
    enviarFormulario();
    await vi.waitFor(() => expect(f.componentInstance.mensaje()).toContain('Quedó pendiente'));
    f.detectChanges();
    const botones = Array.from(f.nativeElement.querySelectorAll('app-historial button')) as HTMLButtonElement[];
    botones.find(b => b.textContent?.includes('Enviados'))!.click(); f.detectChanges();
    expect(f.nativeElement.querySelector('app-historial').textContent).toContain('Gracias por compartir tus conocimientos');
    expect(f.componentInstance.estrellas).toBe(55);
  });
});
