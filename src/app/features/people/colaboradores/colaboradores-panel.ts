import { Component, computed, input, output } from '@angular/core';
import type { Colaborador } from '../../../core/models/impulsa.models';
import { AvatarPersona } from './avatar-persona';

@Component({
  selector: 'app-people-colaboradores', imports: [AvatarPersona],
  templateUrl: './colaboradores-panel.html', styleUrl: './colaboradores-panel.css',
})
export class ColaboradoresPanel {
  readonly colaboradores = input.required<readonly Colaborador[]>();
  readonly consulta = input('');
  readonly recientesIds = input<readonly string[]>([]);
  readonly seleccionadoId = input<string | null>(null);
  readonly consultaCambio = output<string>();
  readonly seleccionar = output<string>();
  readonly buscando = computed(() => !!this.consulta().trim());
  readonly resultados = computed(() => {
    const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');
    const consulta = normalizar(this.consulta());
    return this.colaboradores().filter(c => normalizar(`${c.nombre} ${c.apellido}`).includes(consulta)
      || normalizar(c.identificacionInterna).includes(consulta));
  });
  readonly visibles = computed(() => this.buscando() ? this.resultados() : this.recientesIds()
    .map(id => this.colaboradores().find(c => c.id === id))
    .filter((c): c is Colaborador => !!c).slice(0, 3));
}
