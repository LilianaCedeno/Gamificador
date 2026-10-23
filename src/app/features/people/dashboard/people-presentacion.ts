import type { Categoria, Reconocimiento } from '../../../core/models/impulsa.models';

/** Indicadores de lectura, por fecha de registro y todos los estados. No otorgan estrellas. */
export function calcularActividadPeople(registros: readonly Reconocimiento[], personaId: string | null, ahora: Date) {
  const limite = ahora.getTime();
  if (!Number.isFinite(limite)) throw new Error('Fecha de referencia inválida');
  const inicioSemana = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
  inicioSemana.setUTCDate(inicioSemana.getUTCDate() - (inicioSemana.getUTCDay() + 6) % 7);
  const finSemana = new Date(inicioSemana); finSemana.setUTCDate(finSemana.getUTCDate() + 7);
  const inicioMes = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1);
  const inicioAnterior = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1);
  let semana = 0, actual = 0, anterior = 0, sinFecha = 0;
  for (const r of registros) {
    if (!personaId || r.destinatarioId !== personaId) continue;
    const fecha = Date.parse(r.fecha);
    if (!Number.isFinite(fecha)) { sinFecha++; continue; }
    if (fecha > limite) continue;
    if (fecha >= inicioSemana.getTime() && fecha < finSemana.getTime()) semana++;
    if (fecha >= inicioMes) actual++;
    else if (fecha >= inicioAnterior) anterior++;
  }
  return {
    semana, actual, anterior, sinFecha,
    mesActual: new Date(inicioMes).toISOString().slice(0, 7),
    mesAnterior: new Date(inicioAnterior).toISOString().slice(0, 7),
    inicioSemana: inicioSemana.toISOString(),
    finSemana: new Date(finSemana.getTime() - 1).toISOString(),
    variacion: anterior === 0 ? null : (actual - anterior) / anterior * 100,
  };
}

/** Frecuencia = registros de toda la muestra, de cualquier estado; empate conserva orden de datos. */
export function ordenarCategoriasPeople(categorias: readonly Categoria[], registros: readonly Reconocimiento[]) {
  const usos = new Map<string, number>();
  for (const r of registros) usos.set(r.categoriaId, (usos.get(r.categoriaId) ?? 0) + 1);
  const ordenadas = categorias.map((categoria, orden) => ({ categoria, orden, usos: usos.get(categoria.id) ?? 0 }))
    .sort((a, b) => b.usos - a.usos || a.orden - b.orden);
  return { categorias: ordenadas.map(c => c.categoria), hayUso: ordenadas.some(c => c.usos > 0) };
}
