import { Injectable } from '@angular/core';
import { Observable, defer, of, throwError, delay } from 'rxjs';
import type { Antiguedad, Categoria, Colaborador, Evidencia, ProgresoCategoria, Reconocimiento, ResumenMensual } from '../models/impulsa.models';
import { crearEscenarioMock } from '../../mocks/impulsa.mock';
import { calcularAntiguedad, calcularProgreso, calcularResumenMensual } from '../../mocks/impulsa-calculos.mock';

export interface DashboardColaborador {
  perfil: Colaborador;
  antiguedad: Antiguedad;
  companeros: readonly Colaborador[];
  categorias: readonly Categoria[];
  progresos: readonly ProgresoCategoria[];
  historial: readonly Reconocimiento[];
  resumen: ResumenMensual;
}
export interface NuevoReconocimiento {
  destinatarioId: string;
  categoriaId: string;
  motivo: string;
  evidencias: readonly Evidencia[];
}
export type EscenarioDashboard = 'normal' | 'vacio' | 'error';

@Injectable({ providedIn: 'root' })
export class ColaboradorDataService {
  private readonly datos = crearEscenarioMock();
  private readonly reconocimientos: Reconocimiento[] = [...this.datos.reconocimientos];
  private secuencia = 0;
  /** Identidad exclusivamente demo, independiente de la sesión y permisos reales. */
  private readonly colaboradorId = 'col-1';
  private readonly referencia = '2026-10-19';

  cargar(escenario: EscenarioDashboard = 'normal'): Observable<DashboardColaborador> {
    return defer(() => {
      if (escenario === 'error') return throwError(() => new Error('No se pudo cargar la demostración.'));
      return of(this.construir(escenario === 'vacio' ? [] : this.reconocimientos));
    }).pipe(delay(150));
  }

  reconocer(nuevo: NuevoReconocimiento): Observable<DashboardColaborador> {
    return defer(() => {
      const destinatario = this.datos.colaboradores.find(c => c.id === nuevo.destinatarioId);
      const categoria = this.datos.categorias.find(c => c.id === nuevo.categoriaId && c.activa);
      if (!destinatario || destinatario.id === this.colaboradorId || !categoria
        || !nuevo.motivo.trim() || nuevo.motivo.length > 1000) {
        return throwError(() => new Error('Revisa el destinatario, la categoría y el motivo.'));
      }
      if (nuevo.evidencias.some(e => !this.esEnlaceSeguro(e.url))) {
        return throwError(() => new Error('La evidencia debe usar un enlace HTTP o HTTPS.'));
      }
      const reconocimiento: Reconocimiento = {
        id: `demo-nuevo-${++this.secuencia}`, origen: 'INTERNO', emisorId: this.colaboradorId,
        destinatarioId: nuevo.destinatarioId, categoriaId: nuevo.categoriaId,
        motivo: nuevo.motivo.trim(), evidencias: structuredClone(nuevo.evidencias),
        fecha: new Date().toISOString(), estado: 'PENDIENTE',
      };
      this.reconocimientos.push(reconocimiento);
      return of(this.construir(this.reconocimientos));
    }).pipe(delay(150));
  }

  private esEnlaceSeguro(valor: string): boolean {
    try { return ['https:', 'http:'].includes(new URL(valor).protocol); } catch { return false; }
  }

  private construir(reconocimientos: readonly Reconocimiento[]): DashboardColaborador {
    const perfil = this.datos.colaboradores.find(c => c.id === this.colaboradorId)!;
    return structuredClone({
      perfil,
      antiguedad: calcularAntiguedad(perfil.fechaIngreso, this.referencia),
      companeros: this.datos.colaboradores.filter(c => c.id !== perfil.id),
      categorias: this.datos.categorias,
      progresos: this.datos.categorias.map(c => calcularProgreso(perfil.id, c, reconocimientos)),
      historial: reconocimientos.filter(r => r.destinatarioId === perfil.id
        || (r.origen === 'INTERNO' && r.emisorId === perfil.id))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
      resumen: calcularResumenMensual(perfil.id, this.referencia.slice(0, 7), this.datos.categorias, reconocimientos),
    });
  }
}
