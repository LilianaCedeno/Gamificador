import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { PeopleDashboard } from './people-dashboard';
import { PeopleDataService, type PanelPeopleData } from '../../../core/data-access/people-data.service';
import { PeopleIdentidadService } from '../../../core/data-access/people-identidad.service';
import { CLAVE_TEMA_IMPULSA } from '../../../core/data-access/tema.service';
import { CLAVE_RECIENTES_PEOPLE } from '../colaboradores/people-recientes.service';
import { Dashboard } from '../../colaborador/dashboard/dashboard';
import { By } from '@angular/platform-browser';
import { GestionCategorias } from '../categorias/gestion-categorias';

describe('Panel General People', () => {
  let datos: PanelPeopleData;
  beforeEach(async () => {
    localStorage.removeItem(CLAVE_TEMA_IMPULSA); sessionStorage.removeItem(CLAVE_RECIENTES_PEOPLE);
    datos = await firstValueFrom(new PeopleDataService().cargar('2026-10'));
  });
  afterEach(() => { localStorage.removeItem(CLAVE_TEMA_IMPULSA); sessionStorage.removeItem(CLAVE_RECIENTES_PEOPLE); });

  function preparar(cargar = vi.fn().mockReturnValue(of(datos)), obtener = vi.fn().mockReturnValue(of({ persona: datos.colaboradores[2], origen: 'DEMOSTRACION' }))) {
    TestBed.configureTestingModule({ providers: [
      { provide: PeopleDataService, useValue: { cargar } },
      { provide: PeopleIdentidadService, useValue: { obtener } },
    ] });
    const f = TestBed.createComponent(PeopleDashboard); f.detectChanges();
    return { f, cargar, obtener };
  }
  function buscar(f: ReturnType<typeof preparar>['f'], consulta: string) {
    const input = f.nativeElement.querySelector('#people-busqueda') as HTMLInputElement;
    input.value = consulta; input.dispatchEvent(new Event('input', { bubbles: true })); f.detectChanges();
  }

  it('inicia en Resumen general sin colaborador y centra una franja con solo el título', () => {
    const { f } = preparar();
    expect(f.componentInstance.vistaGeneral()).toBe('resumen');
    expect(f.componentInstance.seleccionadoId()).toBeNull();
    expect(f.nativeElement.querySelector('app-people-consulta h2').textContent).toBe('Resumen general');
    expect(f.nativeElement.querySelector('#people-nav-resumen').getAttribute('aria-pressed')).toBe('true');
    expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
    expect(f.nativeElement.querySelector('#people-busqueda')).not.toBeNull();
    const franja = f.nativeElement.querySelector('.intro') as HTMLElement;
    expect(franja.children).toHaveLength(1);
    expect(franja.querySelector('h1')?.textContent).toBe('Mantenedor People');
    expect(getComputedStyle(franja).textAlign).toBe('center');
    expect(getComputedStyle(franja).display).toBe('grid');
    expect(getComputedStyle(franja).placeItems).toBe('center');
  });

  it('conserva una etiqueta discreta de demostración y elimina avisos técnicos extensos', () => {
    const { f } = preparar();
    expect(f.nativeElement.querySelectorAll('.entorno-demo')).toHaveLength(1);
    expect(f.nativeElement.querySelector('.entorno-demo').textContent).toBe('Demostración');
    expect(f.nativeElement.querySelector('.escenarios-demo')).toBeNull();
    expect(f.nativeElement.querySelector('app-people-consulta .alcance').textContent).toBe('Todos los colaboradores');
    expect(f.nativeElement.querySelector('app-people-consulta').textContent).not.toContain('La muestra es limitada');
    f.nativeElement.querySelector('#people-nav-categorias').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('.gestion-encabezado').textContent).not.toContain('Demostración:');
    expect(f.nativeElement.querySelector('.gestion-encabezado p')).toBeNull();
    expect(f.nativeElement.querySelector('#categoria-nombre')).not.toBeNull();
    expect(f.nativeElement.querySelector('button[type="submit"]').disabled).toBe(false);
    expect(f.nativeElement.querySelector('.entorno-demo')).not.toBeNull();
  });

  it('mantiene un solo acceso a la gestion de categorias durante la navegacion', () => {
    const { f } = preparar();
    const comprobar = () => {
      const lateral = f.nativeElement.querySelector('.barra-lateral') as HTMLElement;
      expect(lateral.querySelector('.categorias, .accesos-categorias')).toBeNull();
      expect(lateral.querySelectorAll('#people-nav-categorias')).toHaveLength(1);
      expect(lateral.querySelectorAll('.navegacion-lateral > button')).toHaveLength(3);
      expect(lateral.querySelector('#people-nav-categorias')?.textContent).toContain('categor');
    };
    comprobar();
    f.nativeElement.querySelector('#people-nav-categorias').click(); f.detectChanges(); comprobar();
    expect(f.nativeElement.querySelector('app-people-gestion-categorias')).not.toBeNull();
    expect(f.nativeElement.querySelectorAll('.lista-categorias > li')).toHaveLength(5);
    f.nativeElement.querySelector('#people-nav-informes').click(); f.detectChanges(); comprobar();
    expect(f.nativeElement.querySelector('app-people-consulta h2').textContent).toBe('Historial e informes');
    f.nativeElement.querySelector('#people-nav-resumen').click(); f.detectChanges(); comprobar();
    expect(f.nativeElement.querySelector('app-people-consulta h2').textContent).toBe('Resumen general');
    f.componentInstance.seleccionar('col-1'); f.detectChanges(); comprobar();
    expect(f.nativeElement.querySelectorAll('.paneles-revision > section')).toHaveLength(6);
  });

  it('evita que la tarjeta de recientes y su componente colapsen dentro del Flexbox lateral', async () => {
    const { f } = preparar(); await f.whenStable();
    for (const id of ['col-1', 'col-2', 'people-1']) f.componentInstance.seleccionar(id);
    f.detectChanges();
    const tarjeta = f.nativeElement.querySelector('.colaboradores-recientes') as HTMLElement;
    const componente = tarjeta.querySelector('app-people-colaboradores') as HTMLElement;
    for (const elemento of [tarjeta, componente]) {
      expect(getComputedStyle(elemento).flexBasis).toBe('auto');
      expect(getComputedStyle(elemento).flexShrink).toBe('0');
      expect(getComputedStyle(elemento).minHeight).toBe('min-content');
    }
    expect(tarjeta.querySelector('input[type="search"]')).not.toBeNull();
    expect(tarjeta.querySelectorAll('.resultado')).toHaveLength(3);
    const primera = tarjeta.querySelector('.resultado') as HTMLButtonElement;
    expect(primera.textContent).toContain('Sara Prueba');
    primera.click(); f.detectChanges();
    expect(tarjeta.querySelectorAll('.resultado[aria-pressed="true"]')).toHaveLength(1);
    expect(tarjeta.querySelector('.resultado[aria-pressed="true"]')?.textContent).toContain('Sara Prueba');
  });
  it('conserva identidad discreta y abre resumen general desde el lateral', () => {
    const { f } = preparar();
    expect(f.nativeElement.querySelector('h1').textContent).toBe('Mantenedor People');
    expect(f.nativeElement.querySelectorAll('[role="tab"]')).toHaveLength(0);
    expect(f.nativeElement.querySelector('.aviso-demo')).toBeNull();
    expect(f.nativeElement.querySelector('.resumen-general')).toBeNull();
    expect(f.nativeElement.querySelector('.identidad-people small').textContent).toBe('Demostraci\u00f3n');
    expect(f.nativeElement.querySelector('.identidad-people small').title).toContain('sin autenticaci');
    f.componentInstance.mes.set('2026-10');
    f.nativeElement.querySelector('.navegacion-lateral button').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('[data-indicador="pendientes"]').textContent).toBe('1');
    expect(f.nativeElement.querySelector('[data-indicador="aprobados"]').textContent).toBe('39');
    expect(f.nativeElement.querySelector('[data-indicador="rechazados"]').textContent).toBe('1');
    expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
  });

  it('busca por nombre e identificación y muestra ausencia de resultados', () => {
    const { f } = preparar();
    buscar(f, 'ana');
    expect(f.nativeElement.querySelectorAll('.resultado')).toHaveLength(1);
    expect(f.nativeElement.querySelector('.resultado').textContent).toContain('Ana Ejemplo');
    buscar(f, 'DEMO-002');
    expect(f.nativeElement.querySelector('.resultado').textContent).toContain('Luis Muestra');
    buscar(f, 'inexistente');
    expect(f.nativeElement.querySelectorAll('.resultado')).toHaveLength(0);
    expect(f.nativeElement.textContent).toContain('No hay colaboradores que coincidan');
  });

  it('mantiene la identidad People separada y sustituye el contexto al cambiar de colaborador', () => {
    const { f } = preparar();
    buscar(f, 'DEMO-001'); f.nativeElement.querySelector('.resultado').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('app-people-revision').textContent).toContain('Ana Ejemplo');
    expect(f.nativeElement.querySelector('.ficha-revision').textContent).toContain('ana@example.invalid');
    expect(f.nativeElement.querySelector('.identidad-people').textContent).toContain('Sara Prueba');
    expect(f.nativeElement.querySelector('.identidad-people').textContent).not.toContain('Ana');
    buscar(f, 'DEMO-002'); f.nativeElement.querySelector('.resultado').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('app-people-revision').textContent).toContain('Luis Muestra');
    expect(f.nativeElement.querySelector('app-people-revision').textContent).not.toContain('Ana Ejemplo');
    expect(f.nativeElement.querySelector('.ficha-revision').textContent).toContain('luis@example.invalid');
    expect(f.nativeElement.querySelector('.ficha-revision').textContent).not.toContain('ana@example.invalid');
    expect(f.nativeElement.querySelectorAll('.resultado[aria-pressed="true"]')).toHaveLength(1);
    expect(f.nativeElement.querySelector('[data-indicador]')).toBeNull();
    expect(f.nativeElement.querySelector('.identidad-people').textContent).toContain('Sara Prueba');
  });

  it('limpia la selección, vuelve al general y recupera foco en búsqueda', async () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    f.nativeElement.querySelector('app-people-revision button').click(); f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
    expect(f.nativeElement.querySelector('.ficha-revision')).toBeNull();
    expect(f.componentInstance.consulta()).toBe('');
    expect(document.activeElement?.id).toBe('people-busqueda');
    f.componentInstance.seleccionar('id-inexistente'); f.detectChanges();
    expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
  });

  it('conserva navegación sticky y banner sticky dentro del área de revisión', () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-2'); f.detectChanges();
    const sticky = f.nativeElement.querySelector('.people-sticky') as HTMLElement;
    expect(getComputedStyle(sticky).position).toBe('sticky');
    expect(getComputedStyle(sticky).top).toBe('0px');
    expect(getComputedStyle(sticky).zIndex).toBe('30');
    expect(f.nativeElement.querySelector('.revision-principal .banner-sticky app-people-revision')).not.toBeNull();
    expect(getComputedStyle(f.nativeElement.querySelector('.banner-sticky')).position).toBe('sticky');
    expect(sticky.querySelector('.identidad-people')).not.toBeNull();
    expect(sticky.querySelector('.selector-tema')).not.toBeNull();
  });

  it('ajusta el offset del banner a la altura real de navegación y libera el observador', async () => {
    let notificar: (() => void) | undefined;
    const observe = vi.fn(), disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { notificar = callback; }
      observe = observe;
      disconnect = disconnect;
    });
    try {
      const { f } = preparar(); await f.whenStable();
      const cabecera = f.nativeElement.querySelector('.people-sticky') as HTMLElement;
      const medir = vi.spyOn(cabecera, 'getBoundingClientRect').mockReturnValue({ height: 104 } as DOMRect);
      expect(observe).toHaveBeenCalledWith(cabecera);
      notificar!();
      expect(f.nativeElement.style.getPropertyValue('--people-nav-height')).toBe('104px');
      medir.mockReturnValue({ height: 132 } as DOMRect); notificar!();
      expect(f.nativeElement.style.getPropertyValue('--people-nav-height')).toBe('132px');
      f.destroy(); expect(disconnect).toHaveBeenCalledOnce();
    } finally { vi.unstubAllGlobals(); }
  });


  it('muestra carga, error, recuperación y muestra vacía sin mantener una revisión anterior', () => {
    const pendiente = new Subject<PanelPeopleData>();
    const cargar = vi.fn().mockReturnValueOnce(pendiente).mockReturnValueOnce(throwError(() => new Error())).mockReturnValue(of(datos));
    const { f } = preparar(cargar);
    expect(f.nativeElement.textContent).toContain('Cargando Panel General People');
    expect(f.nativeElement.querySelector('[data-indicador]')).toBeNull();
    pendiente.next(datos); f.detectChanges();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    f.componentInstance.cargar(); f.detectChanges();
    expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
    expect(f.nativeElement.querySelector('.error').textContent).toContain('No se pudo cargar');
    f.nativeElement.querySelector('.error button').click(); f.detectChanges();
    f.componentInstance.mes.set('2026-10'); f.componentInstance.abrirGeneral('resumen'); f.detectChanges();
    expect(f.nativeElement.querySelector('[data-indicador="aprobados"]').textContent).toBe('39');
    cargar.mockReturnValue(of({ ...datos, colaboradores: [], reconocimientos: [], indicadores: { pendientes: 0, aprobadosMes: 0, rechazadosMes: 0, decisionesSinFechaValida: 0, decisionesSinFechaEnMes: 0 } }));
    f.componentInstance.cambiarEscenario('vacio'); f.detectChanges();
    f.componentInstance.abrirGeneral('resumen'); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No hay colaboradores disponibles');
    expect(f.nativeElement.textContent).toContain('No hay decisiones en el mes seleccionado.');
    expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
    expect(f.nativeElement.querySelector('.identidad-people').textContent).toContain('Sara Prueba');
  });

  it('filtra el mes desde la consulta central sin recargar ni perder recientes', () => {
    const { f, cargar } = preparar();
    f.componentInstance.seleccionar('col-1'); f.componentInstance.abrirGeneral('resumen'); f.detectChanges();
    const llamadas = cargar.mock.calls.length;
    const mes = f.nativeElement.querySelector('app-people-consulta input[type="month"]') as HTMLInputElement;
    mes.value = '2026-09'; mes.dispatchEvent(new Event('change')); f.detectChanges();
    expect(f.nativeElement.querySelector('[data-indicador="aprobados"]').textContent).toBe('16');
    expect(cargar).toHaveBeenCalledTimes(llamadas);
    expect(f.componentInstance.recientes.recientes()).toEqual(['col-1']);
  });

  it('mantiene tres recientes únicos sin scroll permanente y busca fuera de ellos', async () => {
    const { f } = preparar(); await f.whenStable();
    expect(f.nativeElement.querySelectorAll('.resultado')).toHaveLength(0);
    expect(f.nativeElement.textContent).toContain('Todavía no has consultado');
    for (const id of ['col-1', 'col-2', 'people-1', 'col-1']) f.componentInstance.seleccionar(id);
    f.detectChanges();
    expect(f.componentInstance.recientes.recientes()).toEqual(['col-1', 'people-1', 'col-2']);
    expect(f.nativeElement.querySelectorAll('.resultado')).toHaveLength(3);
    expect(getComputedStyle(f.nativeElement.querySelector('.resultados')).overflowY).toBe('visible');
    expect(f.nativeElement.querySelector('.resultado').textContent).not.toContain('Seleccionar');
    f.componentInstance.limpiarSeleccion(); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.resultado')).toHaveLength(3);
    buscar(f, 'DEMO-003');
    expect(f.nativeElement.querySelector('.resultado').textContent).toContain('Sara Prueba');
    f.componentInstance.abrirGeneral('informes'); f.detectChanges();
    expect(f.nativeElement.querySelector('app-people-consulta h2').textContent).toBe('Historial e informes');
    expect(f.nativeElement.querySelector('.barra-lateral')).not.toBeNull();
    f.componentInstance.seleccionar('col-2'); f.detectChanges();
    expect(f.componentInstance.vistaGeneral()).toBeNull();
    expect(f.nativeElement.querySelectorAll('.paneles-revision > section')).toHaveLength(6);
  });

  it('descarta respuestas de cargas anteriores', () => {
    const anterior = new Subject<PanelPeopleData>();
    const actual = new Subject<PanelPeopleData>();
    const cargar = vi.fn().mockReturnValueOnce(anterior).mockReturnValueOnce(actual);
    const { f } = preparar(cargar);
    f.componentInstance.cambiarMes('2026-11');
    actual.next({ ...datos, mes: '2026-11' }); anterior.next(datos); f.detectChanges();
    expect(f.componentInstance.datos()?.mes).toBe('2026-11');
    expect(f.componentInstance.estado()).toBe('listo');
  });

  it('maneja ausencia de identidad sin atribuirle la del colaborador', () => {
    const obtener = vi.fn().mockReturnValueOnce(throwError(() => new Error())).mockReturnValue(of({ persona: datos.colaboradores[2], origen: 'DEMOSTRACION' }));
    const { f } = preparar(undefined, obtener);
    expect(f.nativeElement.querySelector('.identidad-no-disponible').textContent).toContain('Identidad People no disponible');
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    expect(f.nativeElement.querySelector('.identidad-people')).toBeNull();
    f.nativeElement.querySelector('.identidad-no-disponible button').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('.identidad-people').textContent).toContain('Sara Prueba');
  });

  it('reutiliza la preferencia de tema de Colaborador y la restaura desde localStorage', async () => {
    localStorage.setItem(CLAVE_TEMA_IMPULSA, 'claro');
    const { f } = preparar(); await f.whenStable();
    expect(f.nativeElement.querySelector('.people-shell').getAttribute('data-tema')).toBe('claro');
    const colaborador = TestBed.createComponent(Dashboard); colaborador.detectChanges(); await colaborador.whenStable();
    expect(colaborador.componentInstance.preferencia).toBe(f.componentInstance.preferencia);
    expect(colaborador.nativeElement.querySelector('.impulsa-shell').getAttribute('data-tema')).toBe('claro');
    f.nativeElement.querySelector('.selector-tema').click(); f.detectChanges(); colaborador.detectChanges();
    expect(f.nativeElement.querySelector('.people-shell').getAttribute('data-tema')).toBe('oscuro');
    expect(colaborador.nativeElement.querySelector('.impulsa-shell').getAttribute('data-tema')).toBe('oscuro');
    expect(localStorage.getItem(CLAVE_TEMA_IMPULSA)).toBe('oscuro');
  });

  it('predetermina tema oscuro y monta los datos reales de la muestra sin requerir AuthService', async () => {
    const f = TestBed.createComponent(PeopleDashboard); f.detectChanges();
    await f.whenStable();
    await vi.waitFor(() => expect(f.componentInstance.estado()).toBe('listo'));
    f.detectChanges();
    expect(f.componentInstance.preferencia.tema()).toBe('oscuro');
    expect(f.nativeElement.querySelector('.selector-tema').getAttribute('aria-label')).toBe('Activar tema claro');
    expect(f.componentInstance.identidad()?.origen).toBe('DEMOSTRACION');
    expect(f.componentInstance.datos()?.colaboradores).toHaveLength(3);
  });
  it('deriva las insignias y sustituye todo el historial al cambiar de persona', () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    expect(f.componentInstance.estrellas()).toBe(55);
    expect(f.componentInstance.logros()).toBe(4);
    expect(f.nativeElement.querySelectorAll('app-people-insignias article')).toHaveLength(5);
    expect(f.nativeElement.querySelector('img[src="images/insignias/platino.png"]')).not.toBeNull();
    f.componentInstance.activarSeccion('historial'); f.detectChanges();
    expect(f.nativeElement.querySelector('app-historial').textContent).toContain('respaldo insuficiente');
    f.componentInstance.seleccionar('col-2'); f.detectChanges();
    expect(f.componentInstance.estrellas()).toBe(0);
    f.componentInstance.activarSeccion('historial'); f.detectChanges();
    const historial = f.nativeElement.querySelector('app-historial');
    expect(historial.textContent).toContain('pendiente de revisi');
    expect(historial.textContent).not.toContain('respaldo insuficiente');
    expect(historial.querySelectorAll('button')).toHaveLength(2);
    expect(historial.querySelector('summary')).not.toBeNull();
  });

  it('presenta los seis paneles simultáneamente dentro de Perfil', () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    const paneles = Array.from(f.nativeElement.querySelectorAll('.paneles-revision > section')) as HTMLElement[];
    expect(paneles.map(p => p.querySelector('h2')?.textContent)).toEqual([
      'Información general', 'Resumen de reconocimientos', 'Categorías y estrellas',
      'Últimas insignias', 'Posición en ranking', 'Actividad reciente',
    ]);
    expect(paneles.every(p => !p.hidden && !p.closest('[hidden]'))).toBe(true);
    expect(f.nativeElement.querySelector('[role="tablist"]')).not.toBeNull();
    expect(f.componentInstance.resumen()).toEqual({ total: 56, aprobados: 55, pendientes: 0, rechazados: 1 });
    expect(f.nativeElement.querySelector('.ranking').textContent).toContain('Próximamente');
    expect(f.nativeElement.querySelector('.ranking button')).toBeNull();
    expect(f.nativeElement.querySelectorAll('.categorias li')).toHaveLength(0);
    expect(f.nativeElement.querySelector('#people-nav-categorias')).not.toBeNull();
    expect(f.nativeElement.querySelector('.accesos-categorias')).toBeNull();
    expect(f.nativeElement.querySelector('.categorias .categoria-estado')).toBeNull();
  });

  it('ordena ascensos existentes y vacía métricas e insignias al seleccionar otra persona', () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    expect(f.componentInstance.ultimasInsignias()).toHaveLength(10);
    const fechas = f.componentInstance.ultimasInsignias().map(a => a.fecha);
    expect(fechas).toEqual([...fechas].sort().reverse());
    f.componentInstance.seleccionar('col-2'); f.detectChanges();
    expect(f.componentInstance.ultimasInsignias()).toHaveLength(0);
    expect(f.componentInstance.resumen()).toEqual({ total: 1, aprobados: 0, pendientes: 1, rechazados: 0 });
    expect(f.nativeElement.querySelector('ul.ascensos').textContent).toContain('Todavía no hay insignias');
    expect(f.nativeElement.querySelectorAll('.paneles-revision > section')).toHaveLength(6);
  });

  it('navega por cuatro opciones con teclado y solo monta el contenido activo', () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    const perfil = f.nativeElement.querySelector('#people-tab-perfil') as HTMLButtonElement;
    perfil.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })); f.detectChanges();
    expect(document.activeElement?.id).toBe('people-tab-insignias');
    expect(f.componentInstance.seccion()).toBe('insignias');
    expect(f.nativeElement.querySelector('.paneles-revision')).toBeNull();
    expect(f.nativeElement.querySelector('app-historial')).toBeNull();
    expect(f.nativeElement.querySelectorAll('app-people-insignias article')).toHaveLength(5);
    for (const tab of f.nativeElement.querySelectorAll('[role="tab"]')) expect(f.nativeElement.querySelector('#' + tab.getAttribute('aria-controls'))).not.toBeNull();
    const paneles = Array.from(f.nativeElement.querySelectorAll('[role="tabpanel"]')) as HTMLElement[];
    expect(paneles.filter(p => !p.hidden)).toHaveLength(1);
    f.nativeElement.querySelector('#people-tab-ranking').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('#people-panel-ranking').textContent).toContain('Próximamente');
    f.nativeElement.querySelector('#people-tab-ranking').dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); f.detectChanges();
    expect(f.componentInstance.seccion()).toBe('historial');
    expect(f.nativeElement.querySelector('app-historial')).not.toBeNull();
    f.nativeElement.querySelector('#people-tab-historial').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.paneles-revision > section')).toHaveLength(6);
  });

  it('abre las vistas de categorías en el centro y conserva colaborador e identidad', async () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    f.nativeElement.querySelector('#people-nav-categorias').click(); f.detectChanges(); await f.whenStable();
    expect(f.nativeElement.querySelectorAll('.lista-categorias li')).toHaveLength(5);
    expect(f.nativeElement.querySelector('.categorias-resumen')).toBeNull();
    expect(document.activeElement?.id).toBe('people-categorias-titulo');
    expect(f.componentInstance.revisado()?.id).toBe('col-1');
    expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
    expect(f.nativeElement.querySelector('[role="tablist"]')).toBeNull();
    expect(f.nativeElement.querySelector('.identidad-people').textContent).toContain('Sara Prueba');
    expect(f.nativeElement.querySelector('.paneles-revision')).toBeNull();
    f.nativeElement.querySelector('#people-nav-categorias').click(); f.detectChanges();
    const gestion = f.nativeElement.querySelector('app-people-gestion-categorias');
    expect(gestion.textContent).toContain('Gestión de Categorías');
    expect(gestion.querySelector('input[required]').disabled).toBe(false);
    expect(gestion.querySelector('button[type="submit"]').textContent).toBe('Crear categoría');
    gestion.querySelector('.gestion-encabezado button').click(); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.paneles-revision > section')).toHaveLength(6);
    expect(f.nativeElement.querySelector('app-people-revision').textContent).toContain('Ana Ejemplo');
    f.componentInstance.limpiarSeleccion(); f.detectChanges();
    f.componentInstance.abrirCategorias('listado'); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.lista-categorias li')).toHaveLength(5);
  });

  it('lleva el foco a la pestaña al abrir una vista desde los enlaces del Perfil', async () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    f.nativeElement.querySelector('.enlace-panel').click(); f.detectChanges(); await f.whenStable();
    expect(document.activeElement?.id).toBe('people-tab-insignias');
    expect(f.nativeElement.querySelector('.vista-insignias')).not.toBeNull();
  });

  it('conserva cambios de categorías durante la sesión y respeta ambos temas sin cambiar reconocimientos', () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    const historial = structuredClone(f.componentInstance.datos()!.reconocimientos);
    f.componentInstance.abrirCategorias('nueva'); f.detectChanges();
    const gestion = f.debugElement.query(By.directive(GestionCategorias)).componentInstance as GestionCategorias;
    for (const tema of ['claro', 'oscuro']) {
      if (f.componentInstance.preferencia.tema() !== tema) f.nativeElement.querySelector('.selector-tema').click();
      f.detectChanges();
      expect(f.nativeElement.querySelector('.people-shell').getAttribute('data-tema')).toBe(tema);
      expect(f.nativeElement.querySelectorAll('.gestion-columnas > section')).toHaveLength(2);
      expect(f.nativeElement.querySelector('[role="tablist"]')).toBeNull();
      expect(f.nativeElement.querySelector('app-people-revision')).toBeNull();
    }
    gestion.formulario.setValue({ nombre: 'Categoría integrada de prueba', descripcion: 'Descripción de prueba', activa: false, estrellasPorDefecto: 5, icono: 'idea' });
    gestion.guardar(); f.detectChanges();
    expect(f.componentInstance.datos()!.categorias).toHaveLength(6);
    gestion.editar(f.componentInstance.gestionCategorias.categorias()[0]);
    gestion.formulario.patchValue({ estrellasPorDefecto: 5, activa: false }); gestion.guardar(); f.detectChanges();
    f.nativeElement.querySelector('.gestion-encabezado button').click(); f.detectChanges();
    expect(f.componentInstance.seleccionadoId()).toBe('col-1');
    expect(f.componentInstance.estrellas()).toBe(55);
    expect(f.componentInstance.ultimasInsignias()).toHaveLength(10);
    expect(f.componentInstance.datos()!.reconocimientos).toEqual(historial);
    f.componentInstance.abrirCategorias('listado'); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.lista-categorias > li')).toHaveLength(6);
    expect(f.nativeElement.querySelector('.lista-categorias').textContent).toContain('Categoría integrada de prueba');
    expect(f.nativeElement.querySelector('.lista-categorias').textContent).toContain('Inactiva');
    const nuevo = f.debugElement.query(By.directive(GestionCategorias)).componentInstance as GestionCategorias;
    nuevo.editar(f.componentInstance.gestionCategorias.categorias()[0]); f.detectChanges();
    f.nativeElement.querySelector('#people-nav-categorias').click(); f.detectChanges();
    expect(nuevo.editandoId()).toBeNull();
    expect(nuevo.formulario.controls.nombre.value).toBe('');
  });

  it('presenta indicadores dinámicos y SVG sin números incrustados', () => {
    const { f } = preparar();
    f.componentInstance.fechaReferencia.set(new Date('2026-10-22T12:00:00Z'));
    f.componentInstance.seleccionar('col-1'); f.detectChanges();
    expect(f.nativeElement.querySelector('[data-personal="estrellas"]').textContent).toBe('55');
    expect(f.nativeElement.querySelector('[data-personal="insignias"]').textContent).toBe('10');
    expect(f.nativeElement.querySelector('[data-personal="semana"]').textContent).toBe('0');
    expect(f.nativeElement.querySelector('[data-personal="mes"]').textContent).toBe('1');
    expect(f.nativeElement.querySelector('.resumen-persona').textContent).toContain('2026-09: 55');
    expect(f.nativeElement.querySelector('.variacion').textContent).toContain('-98.2%');
    for (const svg of f.nativeElement.querySelectorAll('.contador svg')) expect(svg.textContent).toBe('');
    f.componentInstance.fechaReferencia.set(new Date('2026-10-15T12:00:00Z'));
    f.componentInstance.seleccionar('col-2'); f.detectChanges();
    expect(f.nativeElement.querySelector('[data-personal="estrellas"]').textContent).toBe('0');
    expect(f.nativeElement.querySelector('[data-personal="semana"]').textContent).toBe('1');
    expect(f.nativeElement.querySelector('.variacion').textContent).toContain('Sin base de comparación');
  });

  it('mantiene título y filtros del historial fuera de la lista desplazable y reinicia el contexto al cambiar de persona', () => {
    const { f } = preparar();
    f.componentInstance.seleccionar('col-1'); f.componentInstance.activarSeccion('historial'); f.detectChanges();
    const historial = f.nativeElement.querySelector('app-historial');
    const lista = historial.querySelector('.historial') as HTMLElement;
    expect(lista.tabIndex).toBe(0);
    expect(getComputedStyle(lista).overflowY).toBe('auto');
    expect(historial.querySelector('.filtros').nextElementSibling).toBe(lista);
    expect(lista.querySelector('.filtros')).toBeNull();
    expect(f.nativeElement.querySelector('.panel-historial h2').closest('.historial')).toBeNull();
    expect(f.nativeElement.querySelector('.contenido-opcion').classList.contains('historial-activo')).toBe(true);
    historial.querySelectorAll('button')[1].click(); f.detectChanges();
    expect(historial.textContent).toContain('Acompañamiento ficticio pendiente');
    f.componentInstance.seleccionar('col-2'); f.detectChanges();
    expect(f.componentInstance.seccion()).toBe('perfil');
    expect(f.nativeElement.querySelector('app-historial')).toBeNull();
    f.componentInstance.activarSeccion('historial'); f.detectChanges();
    expect(f.nativeElement.querySelector('app-historial')).not.toBe(historial);
    expect(f.nativeElement.querySelector('app-historial button').getAttribute('aria-pressed')).toBe('true');
    expect(f.nativeElement.querySelector('app-historial').textContent).not.toContain('respaldo insuficiente');
  });

});
