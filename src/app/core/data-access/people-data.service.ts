import { Injectable } from '@angular/core';
import { defer, delay, Observable, of, throwError } from 'rxjs';
import type { Categoria, Colaborador, Reconocimiento } from '../models/impulsa.models';
import { crearEscenarioMock } from '../../mocks/impulsa.mock';

export interface IndicadoresPeople {
  pendientes: number;
  aprobadosMes: number;
  rechazadosMes: number;
  decisionesSinFechaValida: number;
  decisionesSinFechaEnMes: number;
}
export interface PanelPeopleData {
  mes: string;
  colaboradores: readonly Colaborador[];
  categorias: readonly Categoria[];
  reconocimientos: readonly Reconocimiento[];
  indicadores: IndicadoresPeople;
}
export type EscenarioPeople = 'normal' | 'vacio' | 'error';

export function esMesPeopleValido(mes: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

/** Lectura de la muestra en UTC. Nunca valida solicitudes ni modifica puntuaciones. */
export function calcularIndicadoresPeople(reconocimientos: readonly Reconocimiento[], mes: string): IndicadoresPeople {
  if (!esMesPeopleValido(mes)) throw new Error('Mes inválido');
  const resultado: IndicadoresPeople = {
    pendientes: 0, aprobadosMes: 0, rechazadosMes: 0,
    decisionesSinFechaValida: 0, decisionesSinFechaEnMes: 0,
  };
  const mesDeFecha = (fecha: string | undefined): string | null => {
    if (!fecha || !Number.isFinite(Date.parse(fecha))) return null;
    return new Date(fecha).toISOString().slice(0, 7);
  };
  for (const reconocimiento of reconocimientos) {
    if (reconocimiento.estado === 'PENDIENTE') { resultado.pendientes++; continue; }
    const mesDecision = mesDeFecha(reconocimiento.fechaDecision);
    if (!mesDecision) resultado.decisionesSinFechaValida++;
    if ((mesDecision ?? mesDeFecha(reconocimiento.fecha)) !== mes) continue;
    if (!mesDecision) resultado.decisionesSinFechaEnMes++;
    if (reconocimiento.estado === 'APROBADO') resultado.aprobadosMes++;
    else resultado.rechazadosMes++;
  }
  return resultado;
}

@Injectable({ providedIn: 'root' })
export class PeopleDataService {
  /** Adaptador mock de solo lectura; no comparte ni altera la sesión del colaborador. */
  cargar(mes: string, escenario: EscenarioPeople = 'normal'): Observable<PanelPeopleData> {
    return defer(() => {
      if (!esMesPeopleValido(mes)) return throwError(() => new Error('Selecciona un mes válido.'));
      if (escenario === 'error') return throwError(() => new Error('No se pudo cargar la muestra People.'));
      const muestra = crearEscenarioMock();
      const colaboradores = escenario === 'vacio' ? [] : muestra.colaboradores;
      const reconocimientos = escenario === 'vacio' ? [] : muestra.reconocimientos;
      return of({
        mes, colaboradores, reconocimientos, categorias: muestra.categorias,
        indicadores: calcularIndicadoresPeople(reconocimientos, mes),
      });
    }).pipe(delay(150));
  }
}
