import { Component, computed, input, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import type { Categoria, Colaborador, Reconocimiento } from '../../../core/models/impulsa.models';

@Component({
  selector: 'app-historial', imports: [DatePipe, TitleCasePipe],
  templateUrl: './historial.html', styleUrl: './historial.css',
})
export class Historial {
  readonly reconocimientos = input.required<readonly Reconocimiento[]>();
  readonly personas = input.required<readonly Colaborador[]>();
  readonly categorias = input.required<readonly Categoria[]>();
  readonly colaboradorId = input.required<string>();
  readonly filtro = signal<'RECIBIDOS' | 'ENVIADOS'>('RECIBIDOS');
  readonly visibles = computed(() => this.reconocimientos().filter(r => this.filtro() === 'RECIBIDOS'
    ? r.destinatarioId === this.colaboradorId()
    : r.origen === 'INTERNO' && r.emisorId === this.colaboradorId()));
  nombre(id: string): string {
    const persona = this.personas().find(p => p.id === id);
    return persona ? `${persona.nombre} ${persona.apellido}` : 'Persona no disponible';
  }
  categoria(id: string): string { return this.categorias().find(c => c.id === id)?.nombre ?? 'Categoría no disponible'; }
  emisor(r: Reconocimiento): string { return r.origen === 'INTERNO' ? this.nombre(r.emisorId) : r.emisorExterno.nombre; }
  enlaceDisponible(url: string): boolean {
    try { const u = new URL(url); return ['https:', 'http:'].includes(u.protocol) && !u.hostname.endsWith('.invalid'); }
    catch { return false; }
  }
}
