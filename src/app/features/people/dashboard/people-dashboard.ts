import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, signal } from '@angular/core';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Subscription } from 'rxjs';
import { esMesPeopleValido, PeopleDataService, type EscenarioPeople, type PanelPeopleData } from '../../../core/data-access/people-data.service';
import { PeopleIdentidadService, type IdentidadPeople } from '../../../core/data-access/people-identidad.service';
import { TemaService } from '../../../core/data-access/tema.service';
import { AvatarPersona } from '../colaboradores/avatar-persona';
import { ColaboradoresPanel } from '../colaboradores/colaboradores-panel';
import { ColaboradorRevision } from '../colaboradores/colaborador-revision';
import { PeopleInsignias } from '../colaboradores/people-insignias';
import { Historial } from '../../colaborador/historial/historial';
import { calcularAntiguedad, calcularProgreso } from '../../../mocks/impulsa-calculos.mock';
import { calcularActividadPeople } from './people-presentacion';
import { PeopleRecientesService } from '../colaboradores/people-recientes.service';
import { PeopleConsulta } from '../consultas/people-consulta';
import { CategoriasPeopleService } from '../categorias/categorias-people.service';
import { GestionCategorias } from '../categorias/gestion-categorias';

type SeccionPeople = 'perfil' | 'insignias' | 'ranking' | 'historial';

@Component({
  selector: 'app-people-dashboard',
  imports: [DatePipe, DecimalPipe, TitleCasePipe, AvatarPersona, ColaboradoresPanel, ColaboradorRevision, PeopleInsignias, Historial, PeopleConsulta, GestionCategorias],
  templateUrl: './people-dashboard.html', styleUrl: './people-dashboard.css',
})
export class PeopleDashboard {
  private readonly servicio = inject(PeopleDataService);
  private readonly fuenteIdentidad = inject(PeopleIdentidadService);
  private readonly destruir = inject(DestroyRef);
  private readonly elemento: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  private cargaActual?: Subscription;
  readonly preferencia = inject(TemaService);
  readonly recientes = inject(PeopleRecientesService);
  readonly gestionCategorias = inject(CategoriasPeopleService);
  private readonly datosCargados = signal<PanelPeopleData | null>(null);
  readonly datos = computed<PanelPeopleData | null>(() => {
    const datos = this.datosCargados();
    return datos ? { ...datos, categorias: this.gestionCategorias.categorias() } : null;
  });
  readonly identidad = signal<IdentidadPeople | null>(null);
  readonly identidadCargando = signal(false);
  readonly identidadError = signal('');
  readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  readonly error = signal('');
  readonly mes = signal(new Date().toISOString().slice(0, 7));
  readonly escenario = signal<EscenarioPeople>('normal');
  readonly consulta = signal('');
  readonly seccion = signal<SeccionPeople>('perfil');
  readonly vistaCategorias = signal<'nueva' | 'listado' | null>(null);
  readonly solicitudCategorias = signal(0);
  readonly vistaGeneral = signal<'resumen' | 'informes' | null>('resumen');
  readonly secciones: readonly { id: SeccionPeople; nombre: string }[] = [
    { id: 'perfil', nombre: 'Perfil' }, { id: 'insignias', nombre: 'Insignias' },
    { id: 'ranking', nombre: 'Ranking' }, { id: 'historial', nombre: 'Historial' },
  ];
  readonly fechaReferencia = signal(new Date());
  readonly seleccionadoId = signal<string | null>(null);
  readonly revisado = computed(() => this.datos()?.colaboradores.find(c => c.id === this.seleccionadoId()) ?? null);
  // Recreate the review context on person change, including local history filters and expanded evidence.
  readonly personasEnRevision = computed(() => { const persona = this.revisado(); return persona ? [persona] : []; });
  readonly progresos = computed(() => {
    const persona = this.revisado(), datos = this.datos();
    return persona && datos ? datos.categorias.map(categoria => ({ categoria,
      progreso: calcularProgreso(persona.id, categoria, datos.reconocimientos) })) : [];
  });
  readonly estrellas = computed(() => this.progresos().reduce((total, p) => total + p.progreso.estrellas, 0));
  readonly logros = computed(() => this.progresos().filter(p => p.progreso.insigniaActual).length);
  readonly recibidos = computed(() => this.datos()?.reconocimientos.filter(r => r.destinatarioId === this.revisado()?.id) ?? []);
  readonly historialOrdenado = computed(() => [...(this.datos()?.reconocimientos ?? [])]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.id.localeCompare(b.id)));
  readonly actividadReciente = computed(() => this.historialOrdenado().filter(r => r.destinatarioId === this.revisado()?.id).slice(0, 4));
  readonly actividad = computed(() => calcularActividadPeople(this.datos()?.reconocimientos ?? [], this.revisado()?.id ?? null, this.fechaReferencia()));
  readonly resumen = computed(() => ({
    total: this.recibidos().length,
    aprobados: this.recibidos().filter(r => r.estado === 'APROBADO').length,
    pendientes: this.recibidos().filter(r => r.estado === 'PENDIENTE').length,
    rechazados: this.recibidos().filter(r => r.estado === 'RECHAZADO').length,
  }));
  readonly ultimasInsignias = computed(() => this.progresos().flatMap(p =>
    p.progreso.historialAscensos.map(ascenso => ({ ...ascenso, categoria: p.categoria })))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.reconocimientoId.localeCompare(b.reconocimientoId)));
  readonly antiguedad = computed(() => {
    const persona = this.revisado();
    return persona ? calcularAntiguedad(persona.fechaIngreso, new Date().toISOString().slice(0, 10)) : null;
  });

  constructor() {
    this.cargarIdentidad(); this.cargar();
    afterNextRender(() => {
      const cabecera = this.elemento.nativeElement.querySelector<HTMLElement>('.people-sticky');
      if (!cabecera || typeof ResizeObserver === 'undefined') return;
      const actualizar = () => this.elemento.nativeElement.style.setProperty('--people-nav-height', `${cabecera.getBoundingClientRect().height}px`);
      const observador = new ResizeObserver(actualizar);
      observador.observe(cabecera); actualizar();
      this.destruir.onDestroy(() => observador.disconnect());
    });
  }

  cargarIdentidad(): void {
    if (this.identidadCargando()) return;
    this.identidadCargando.set(true);
    this.identidadError.set('');
    this.fuenteIdentidad.obtener().pipe(takeUntilDestroyed(this.destruir)).subscribe({
      next: identidad => { this.identidad.set(identidad); this.identidadCargando.set(false); },
      error: () => {
        this.identidad.set(null); this.identidadCargando.set(false);
        this.identidadError.set('Identidad People no disponible.');
      },
    });
  }

  cargar(): void {
    if (!esMesPeopleValido(this.mes())) { this.error.set('Selecciona un mes válido.'); return; }
    this.cargaActual?.unsubscribe();
    this.estado.set('cargando'); this.error.set('');
    this.seccion.set('perfil'); this.vistaCategorias.set(null); this.vistaGeneral.set('resumen');
    this.datosCargados.set(null); this.seleccionadoId.set(null);
    this.cargaActual = this.servicio.cargar(this.mes(), this.escenario()).pipe(takeUntilDestroyed(this.destruir)).subscribe({
      next: datos => { this.gestionCategorias.inicializar(datos.categorias); this.datosCargados.set(datos); this.estado.set('listo'); },
      error: () => { this.estado.set('error'); this.error.set('No se pudo cargar el Panel General People. Inténtalo nuevamente.'); },
    });
  }

  cambiarMes(mes: string): void { this.mes.set(mes); this.cargar(); }
  cambiarEscenario(escenario: EscenarioPeople): void { this.escenario.set(escenario); this.cargar(); }

  seleccionar(id: string): void {
    if (this.datos()?.colaboradores.some(c => c.id === id)) {
      this.seleccionadoId.set(id);
      this.recientes.registrar(id); this.consulta.set('');
      this.activarSeccion('perfil');
    }
  }

  limpiarSeleccion(): void {
    this.seleccionadoId.set(null); this.consulta.set('');
    this.seccion.set('perfil'); this.vistaCategorias.set(null); this.vistaGeneral.set(null);
    afterNextRender(() => {
      if (!this.revisado()) this.elemento.nativeElement.querySelector<HTMLElement>('#people-busqueda')?.focus();
    }, { injector: this.injector });
  }

  categoriaNombre(id: string): string { return this.datos()?.categorias.find(c => c.id === id)?.nombre ?? 'Categoría no disponible'; }

  activarSeccion(seccion: SeccionPeople, enfocar = false): void {
    this.seccion.set(seccion); this.vistaCategorias.set(null); this.vistaGeneral.set(null);
    this.reiniciarContenido(enfocar ? `#people-tab-${seccion}` : undefined);
  }

  abrirCategorias(vista: 'nueva' | 'listado'): void {
    this.vistaCategorias.set(vista); this.vistaGeneral.set(null);
    this.solicitudCategorias.update(solicitud => solicitud + 1);
    this.reiniciarContenido('#people-categorias-titulo');
  }

  abrirGeneral(vista: 'resumen' | 'informes'): void {
    this.vistaGeneral.set(vista); this.vistaCategorias.set(null);
    this.reiniciarContenido('#people-consulta-titulo');
  }

  private reiniciarContenido(foco?: string): void {
    afterNextRender(() => {
      const contenido = this.elemento.nativeElement.querySelector<HTMLElement>('.contenido-opcion');
      if (contenido) contenido.scrollTop = 0;
      if (foco) this.elemento.nativeElement.querySelector<HTMLElement>(foco)?.focus();
    }, { injector: this.injector });
  }

  moverPestana(evento: KeyboardEvent, actual: SeccionPeople): void {
    const indice = this.secciones.findIndex(s => s.id === actual);
    let siguiente: number;
    switch (evento.key) {
      case 'ArrowRight': siguiente = (indice + 1) % this.secciones.length; break;
      case 'ArrowLeft': siguiente = (indice + this.secciones.length - 1) % this.secciones.length; break;
      case 'Home': siguiente = 0; break;
      case 'End': siguiente = this.secciones.length - 1; break;
      default: return;
    }
    evento.preventDefault();
    const seccion = this.secciones[siguiente].id;
    this.activarSeccion(seccion);
    this.elemento.nativeElement.querySelector<HTMLElement>(`#people-tab-${seccion}`)?.focus();
  }
}
