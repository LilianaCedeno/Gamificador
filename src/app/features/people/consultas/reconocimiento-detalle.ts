import { afterNextRender, Component, computed, ElementRef, input, output, viewChild } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import type { Categoria, Colaborador, Reconocimiento } from '../../../core/models/impulsa.models';

@Component({
  selector: 'app-people-reconocimiento-detalle', imports: [DatePipe, TitleCasePipe],
  templateUrl: './reconocimiento-detalle.html', styleUrl: './reconocimiento-detalle.css',
})
export class ReconocimientoDetalle {
  readonly reconocimiento = input.required<Reconocimiento>();
  readonly personas = input.required<readonly Colaborador[]>();
  readonly categorias = input.required<readonly Categoria[]>();
  readonly cerrar = output<void>();
  readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  readonly emisor = computed(() => { const r = this.reconocimiento(); return r.origen === 'INTERNO' ? this.nombre(r.emisorId) : r.emisorExterno.nombre; });

  constructor() {
    afterNextRender(() => this.dialogo().nativeElement.showModal());
  }
  nombre(id: string): string {
    const p = this.personas().find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : 'Persona no disponible';
  }
  categoria(id: string): string { return this.categorias().find(c => c.id === id)?.nombre ?? 'Categoría no disponible'; }
  enlaceDisponible(url: string): boolean {
    try { const u = new URL(url); return ['https:', 'http:'].includes(u.protocol) && !u.hostname.endsWith('.invalid'); }
    catch { return false; }
  }
  finalizar(): void { this.dialogo().nativeElement.close(); this.cerrar.emit(); }
}
