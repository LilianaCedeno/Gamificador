import type {
  Antiguedad, Categoria, Insignia, ProgresoCategoria, Reconocimiento, ResumenMensual,
} from '../core/models/impulsa.models';

function fechaCivil(valor: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw new Error('Fecha civil inválida');
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if (!Number.isFinite(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
    throw new Error('Fecha civil inválida');
  }
  return fecha;
}

/** Convención mock: aniversarios de fin de mes se ajustan al último día disponible. */
export function calcularAntiguedad(fechaIngreso: string, fechaReferencia: string): Antiguedad {
  const ingreso = fechaCivil(fechaIngreso);
  const referencia = fechaCivil(fechaReferencia);
  if (ingreso > referencia) throw new Error('La fecha de ingreso es futura');
  const aniversario = (meses: number): Date => {
    const inicio = new Date(Date.UTC(ingreso.getUTCFullYear(), ingreso.getUTCMonth() + meses, 1));
    const ultimo = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth() + 1, 0));
    inicio.setUTCDate(Math.min(ingreso.getUTCDate(), ultimo.getUTCDate()));
    return inicio;
  };
  let meses = (referencia.getUTCFullYear() - ingreso.getUTCFullYear()) * 12
    + referencia.getUTCMonth() - ingreso.getUTCMonth();
  if (aniversario(meses) > referencia) meses--;
  return {
    anios: Math.floor(meses / 12),
    meses: meses % 12,
    dias: Math.round((referencia.getTime() - aniversario(meses).getTime()) / 86400000),
  };
}

/** Regla demostrativa de redondeo, pendiente de validación formal con backend. */
export function calcularUmbrales(categoria: Categoria): readonly Insignia[] {
  const base = categoria.umbralBronce;
  if (!Number.isSafeInteger(base) || base < 1) throw new Error('Umbral base inválido');
  const plata = Math.ceil(base * 1.5);
  const oro = Math.ceil(plata * 1.5);
  if (!Number.isSafeInteger(oro)) throw new Error('Umbral fuera de rango');
  return [
    { categoriaId: categoria.id, nivel: 'BRONCE', umbral: base },
    { categoriaId: categoria.id, nivel: 'PLATA', umbral: plata },
    { categoriaId: categoria.id, nivel: 'ORO', umbral: oro },
  ];
}

/** Solo para UX: backend será responsable de estrellas, validaciones e insignias. */
export function calcularProgreso(
  colaboradorId: string, categoria: Categoria, reconocimientos: readonly Reconocimiento[],
): ProgresoCategoria {
  const umbrales = calcularUmbrales(categoria);
  const aprobados = reconocimientos.filter(r => r.destinatarioId === colaboradorId
    && r.categoriaId === categoria.id && r.estado === 'APROBADO')
    .sort((a, b) => a.fechaDecision!.localeCompare(b.fechaDecision!) || a.id.localeCompare(b.id));
  const estrellas = aprobados.length;
  const obtenidas = umbrales.filter(i => estrellas >= i.umbral);
  const proximaInsignia = umbrales.find(i => estrellas < i.umbral) ?? null;
  return {
    colaboradorId, categoriaId: categoria.id, estrellas,
    insigniaActual: obtenidas.at(-1) ?? null,
    proximaInsignia,
    estrellasFaltantes: proximaInsignia ? proximaInsignia.umbral - estrellas : 0,
    porcentajeAvance: proximaInsignia ? estrellas / proximaInsignia.umbral * 100 : 100,
    historialAscensos: obtenidas.map(insignia => ({
      colaboradorId, insignia,
      fecha: aprobados[insignia.umbral - 1].fechaDecision!,
      reconocimientoId: aprobados[insignia.umbral - 1].id,
    })),
  };
}

/** Mes de decisión UTC; cada aprobación aporta exactamente una estrella. */
export function calcularResumenMensual(
  colaboradorId: string, mes: string, categorias: readonly Categoria[],
  reconocimientos: readonly Reconocimiento[],
): ResumenMensual {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error('Mes inválido');
  const aprobados = reconocimientos.filter(r => r.destinatarioId === colaboradorId
    && r.estado === 'APROBADO' && r.fechaDecision.startsWith(mes + '-'));
  return {
    colaboradorId, mes, estrellasObtenidas: aprobados.length,
    reconocimientosAprobados: aprobados.length,
    estrellasPorCategoria: categorias.map(c => ({
      categoriaId: c.id, estrellas: aprobados.filter(r => r.categoriaId === c.id).length,
    })),
    insigniasObtenidas: categorias.flatMap(c =>
      calcularProgreso(colaboradorId, c, reconocimientos).historialAscensos
        .filter(a => a.fecha.startsWith(mes + '-'))),
  };
}
