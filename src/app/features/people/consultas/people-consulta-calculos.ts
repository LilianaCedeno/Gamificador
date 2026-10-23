import type { EstadoReconocimiento, Reconocimiento } from '../../../core/models/impulsa.models';

export interface FiltrosConsultaPeople {
  mes: string; desde: string; hasta: string; colaboradorId: string; categoriaId: string; estado: EstadoReconocimiento | '';
}

/** Mismo criterio del resumen People existente: decisión válida o registro como alternativa. */
export function fechaConsultaPeople(r: Reconocimiento): string | null {
  const decision = r.estado !== 'PENDIENTE' ? Date.parse(r.fechaDecision) : NaN;
  const fecha = Number.isFinite(decision) ? decision : Date.parse(r.fecha);
  return Number.isFinite(fecha) ? new Date(fecha).toISOString() : null;
}

export function validarFiltrosPeople(f: FiltrosConsultaPeople): string {
  if (f.mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(f.mes)) return 'Selecciona un mes válido.';
  const valida = (valor: string) => !valor || /^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) === valor;
  if (!valida(f.desde) || !valida(f.hasta)) return 'Selecciona fechas válidas.';
  if (f.desde && f.hasta && f.desde > f.hasta) return 'La fecha desde no puede ser posterior a la fecha hasta.';
  return '';
}

export function filtrarConsultaPeople(registros: readonly Reconocimiento[], f: FiltrosConsultaPeople, pendientesGlobales = false): readonly Reconocimiento[] {
  if (validarFiltrosPeople(f)) return [];
  return registros.filter(r => {
    if (f.estado && r.estado !== f.estado || f.colaboradorId && r.destinatarioId !== f.colaboradorId || f.categoriaId && r.categoriaId !== f.categoriaId) return false;
    if (pendientesGlobales && r.estado === 'PENDIENTE') return true;
    const fecha = fechaConsultaPeople(r);
    if (!fecha) return !f.mes && !f.desde && !f.hasta;
    return (!f.mes || fecha.slice(0, 7) === f.mes)
      && (!f.desde || fecha.slice(0, 10) >= f.desde) && (!f.hasta || fecha.slice(0, 10) <= f.hasta);
  }).sort((a, b) => (fechaConsultaPeople(b) ?? '').localeCompare(fechaConsultaPeople(a) ?? '') || a.id.localeCompare(b.id));
}

export function estadisticasConsultaPeople(registros: readonly Reconocimiento[]) {
  const aprobados = registros.filter(r => r.estado === 'APROBADO').length;
  return { total: registros.length, pendientes: registros.filter(r => r.estado === 'PENDIENTE').length,
    aprobados, rechazados: registros.filter(r => r.estado === 'RECHAZADO').length, estrellas: aprobados };
}
