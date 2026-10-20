import { Component, DestroyRef, inject, signal, type Signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColaboradorDataService, type DashboardColaborador, type NuevoReconocimiento } from '../../../core/data-access/colaborador-data.service';
import type { TemaImpulsa } from '../../../core/data-access/tema.service';
import type { Categoria, Colaborador } from '../../../core/models/impulsa.models';
import { ReconocimientoForm } from './reconocimiento-form';

export interface DatosReconocimientoModal {
  companeros: readonly Colaborador[];
  categorias: readonly Categoria[];
  tema: Signal<TemaImpulsa>;
}

@Component({
  selector: 'app-reconocimiento-modal', imports: [ReconocimientoForm],
  templateUrl: './reconocimiento-modal.html', styleUrl: './reconocimiento-modal.css',
})
export class ReconocimientoModal {
  readonly datos = inject<DatosReconocimientoModal>(DIALOG_DATA);
  private readonly referencia = inject<DialogRef<DashboardColaborador>>(DialogRef);
  private readonly servicio = inject(ColaboradorDataService);
  private readonly destroyRef = inject(DestroyRef);
  readonly enviando = signal(false);
  readonly error = signal('');

  constructor() {
    // El backdrop nunca descarta un borrador; Escape solo cierra cuando no hay envío.
    this.referencia.keydownEvents.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(evento => {
      if (evento.key === 'Escape') { evento.preventDefault(); this.cerrar(); }
    });
  }

  cerrar(): void {
    if (!this.enviando()) this.referencia.close();
  }

  enviar(nuevo: NuevoReconocimiento): void {
    if (this.enviando()) return;
    this.enviando.set(true);
    this.error.set('');
    this.servicio.reconocer(nuevo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: datos => {
        this.enviando.set(false);
        this.referencia.close(datos);
      },
      error: () => {
        this.enviando.set(false);
        this.error.set('No se pudo enviar el reconocimiento. Tus datos se conservan; inténtalo de nuevo.');
      },
    });
  }
}
