import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColaboradorDataService, type DashboardColaborador, type EscenarioDashboard } from '../../../core/data-access/colaborador-data.service';
import { TemaService } from '../../../core/data-access/tema.service';
import { InsigniaCard } from '../insignias/insignia-card';
import { Historial } from '../historial/historial';
import { ReconocimientoModal } from '../reconocimientos/reconocimiento-modal';

@Component({
  selector: 'app-colaborador-dashboard', imports: [DatePipe, InsigniaCard, Historial],
  templateUrl: './dashboard.html', styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly servicio = inject(ColaboradorDataService);
  private readonly dialogo = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly destroyRef = inject(DestroyRef);
  readonly preferencia = inject(TemaService);
  readonly datos = signal<DashboardColaborador | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly formularioVisible = signal(false);
  readonly fotoFallida = signal(false);
  readonly escenario = signal<EscenarioDashboard>('normal');
  private referenciaModal?: DialogRef<DashboardColaborador>;
  private carga = 0;

  constructor() {
    this.cargar();
    this.destroyRef.onDestroy(() => this.referenciaModal?.close());
  }

  cargar(escenario: EscenarioDashboard = this.escenario()): void {
    if (this.formularioVisible()) return;
    const carga = ++this.carga;
    this.escenario.set(escenario);
    this.cargando.set(true);
    this.error.set('');
    this.mensaje.set('');
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
    const datos = this.datos();
    if (!datos || this.cargando() || this.formularioVisible()) return;
    this.formularioVisible.set(true);
    this.mensaje.set('');
    this.referenciaModal = this.dialogo.open<DashboardColaborador>(ReconocimientoModal, {
      id: 'impulsa-reconocimiento-modal', role: 'dialog', ariaModal: true,
      ariaLabelledBy: 'titulo-reconocer', ariaDescribedBy: 'ayuda-modal',
      autoFocus: '#titulo-reconocer', restoreFocus: '#abrir-reconocer',
      disableClose: true, closeOnNavigation: false,
      width: '46rem', maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100dvh - 2rem)',
      panelClass: 'impulsa-dialog-pane', backdropClass: 'impulsa-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      data: { companeros: datos.companeros, categorias: datos.categorias, tema: this.preferencia.tema },
    });
    this.referenciaModal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(resultado => {
      this.formularioVisible.set(false);
      this.referenciaModal = undefined;
      if (!resultado) return;
      this.datos.set(resultado);
      this.escenario.set('normal');
      this.mensaje.set('Reconocimiento enviado en esta sesión de demostración. Quedó pendiente de People y no suma estrellas. Puedes verlo en Enviados.');
    });
  }

  get estrellas(): number { return this.datos()?.progresos.reduce((total, p) => total + p.estrellas, 0) ?? 0; }
  get personas() { const d = this.datos(); return d ? [d.perfil, ...d.companeros] : []; }
}
