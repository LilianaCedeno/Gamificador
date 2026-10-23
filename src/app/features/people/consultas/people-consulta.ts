import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import type { PanelPeopleData } from '../../../core/data-access/people-data.service';
import { calcularIndicadoresPeople, esMesPeopleValido } from '../../../core/data-access/people-data.service';
import type { Reconocimiento } from '../../../core/models/impulsa.models';
import { estadisticasConsultaPeople, fechaConsultaPeople, filtrarConsultaPeople, validarFiltrosPeople, type FiltrosConsultaPeople } from './people-consulta-calculos';
import { ReconocimientoDetalle } from './reconocimiento-detalle';

@Component({
  selector: 'app-people-consulta', imports: [DatePipe, TitleCasePipe, ReconocimientoDetalle],
  templateUrl: './people-consulta.html', styleUrl: './people-consulta.css',
})
export class PeopleConsulta {
  readonly datos = input.required<PanelPeopleData>();
  readonly modo = input<'resumen' | 'informes'>('resumen');
  readonly mesInicial = input(new Date().toISOString().slice(0, 7));
  readonly mes = linkedSignal(() => this.mesInicial());
  readonly filtros = signal<FiltrosConsultaPeople>({ mes: '', desde: '', hasta: '', colaboradorId: '', categoriaId: '', estado: '' });
  readonly detalle = signal<Reconocimiento | null>(null);
  readonly criterios = computed(() => this.modo() === 'informes' ? { ...this.filtros(), mes: this.mes() }
    : { mes: this.mes(), estado: this.filtros().estado, desde: '', hasta: '', colaboradorId: '', categoriaId: '' });
  readonly error = computed(() => this.modo() === 'resumen' && !this.mes() ? 'Selecciona un mes válido.' : validarFiltrosPeople(this.criterios()));
  readonly visibles = computed(() => this.error() ? [] : filtrarConsultaPeople(this.datos().reconocimientos, this.criterios(), this.modo() === 'resumen'));
  readonly indicadores = computed(() => esMesPeopleValido(this.mes()) ? calcularIndicadoresPeople(this.datos().reconocimientos, this.mes()) : null);
  readonly estadisticas = computed(() => estadisticasConsultaPeople(this.visibles()));
  readonly porColaborador = computed(() => this.datos().colaboradores.map(p => ({ id: p.id, nombre: `${p.nombre} ${p.apellido}`,
    ...estadisticasConsultaPeople(this.visibles().filter(r => r.destinatarioId === p.id)) })).filter(p => p.total));
  readonly porCategoria = computed(() => this.datos().categorias.map(c => ({ id: c.id, nombre: c.nombre,
    ...estadisticasConsultaPeople(this.visibles().filter(r => r.categoriaId === c.id)) })).filter(c => c.total));
  readonly porMes = computed(() => [...new Set(this.visibles().map(r => fechaConsultaPeople(r)?.slice(0, 7) ?? 'Sin fecha válida'))].sort().reverse()
    .map(mes => ({ mes, ...estadisticasConsultaPeople(this.visibles().filter(r => (fechaConsultaPeople(r)?.slice(0, 7) ?? 'Sin fecha válida') === mes)) })));

  actualizar(campo: keyof FiltrosConsultaPeople, valor: string): void {
    if (campo === 'mes') this.mes.set(valor);
    else this.filtros.update(f => ({ ...f, [campo]: valor }));
  }
  limpiar(): void {
    this.mes.set(this.modo() === 'informes' ? '' : this.mesInicial());
    this.filtros.set({ mes: '', desde: '', hasta: '', colaboradorId: '', categoriaId: '', estado: '' });
  }
  nombre(id: string): string {
    const p = this.datos().colaboradores.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : 'Persona no disponible';
  }
  categoria(id: string): string { return this.datos().categorias.find(c => c.id === id)?.nombre ?? 'Categoría no disponible'; }
}
