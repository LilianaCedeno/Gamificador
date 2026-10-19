import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColaboradorDataService, type DashboardColaborador, type EscenarioDashboard, type NuevoReconocimiento } from '../../../core/data-access/colaborador-data.service';
import { InsigniaCard } from '../insignias/insignia-card';
import { Historial } from '../historial/historial';
import { ReconocimientoForm } from '../reconocimientos/reconocimiento-form';

@Component({
  selector: 'app-colaborador-dashboard', imports: [DatePipe, InsigniaCard, Historial, ReconocimientoForm],
  templateUrl: './dashboard.html', styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly servicio = inject(ColaboradorDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elemento: ElementRef<HTMLElement> = inject(ElementRef);
  readonly datos = signal<DashboardColaborador | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly formularioVisible = signal(false);
  readonly enviando = signal(false);
  readonly fotoFallida = signal(false);
  readonly escenario = signal<EscenarioDashboard>('normal');
  private carga = 0;

  constructor() { this.cargar(); }

  cargar(escenario: EscenarioDashboard = this.escenario()): void {
    const carga = ++this.carga;
    this.escenario.set(escenario);
    this.cargando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.formularioVisible.set(false);
    this.servicio.cargar(escenario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: datos => {
        if (carga !== this.carga) return;
        this.datos.set(datos); this.cargando.set(false);
      },
      error: () => {
        if (carga !== this.carga) return;
        this.datos.set(null); this.error.set('No pudimos cargar tu dashboard de demostración. Inténtalo nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  abrirFormulario(): void {
    this.formularioVisible.set(true);
    this.mensaje.set('');
    setTimeout(() => this.elemento.nativeElement.querySelector<HTMLElement>('#titulo-reconocer')?.focus());
  }

  cerrarFormulario(): void {
    this.formularioVisible.set(false);
    setTimeout(() => this.elemento.nativeElement.querySelector<HTMLElement>('#abrir-reconocer')?.focus());
  }

  enviar(nuevo: NuevoReconocimiento): void {
    if (this.enviando()) return;
    this.enviando.set(true);
    this.error.set('');
    this.servicio.reconocer(nuevo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: datos => {
        this.datos.set(datos); this.escenario.set('normal'); this.enviando.set(false);
        this.cerrarFormulario();
        this.mensaje.set('Reconocimiento enviado en esta sesión de demostración. Quedó pendiente de People y no suma estrellas. Puedes verlo en Enviados.');
      },
      error: () => { this.enviando.set(false); this.error.set('No se pudo enviar el reconocimiento. Revisa los datos e inténtalo de nuevo.'); },
    });
  }

  get estrellas(): number { return this.datos()?.progresos.reduce((total, p) => total + p.estrellas, 0) ?? 0; }
  get personas() { const d = this.datos(); return d ? [d.perfil, ...d.companeros] : []; }
}
