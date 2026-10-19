import { calcularAntiguedad, calcularProgreso, calcularResumenMensual, calcularUmbrales } from './impulsa-calculos.mock';
import { categoriasMock, colaboradoresMock, crearEscenarioMock, evidenciasMock, reconocimientosMock } from './impulsa.mock';

describe('IMPULSA: modelos y mocks de Etapa 1', () => {
  it('incluye cinco categorías, ambos roles y evidencias PDF/JPG/enlace', () => {
    expect(categoriasMock).toHaveLength(5);
    expect(new Set(colaboradoresMock.map(c => c.rol))).toEqual(new Set(['COLABORADOR', 'PEOPLE']));
    expect(evidenciasMock.map(e => e.tipo)).toEqual(['PDF', 'JPG', 'ENLACE']);
    expect(new Set(reconocimientosMock.map(r => r.estado))).toEqual(new Set(['APROBADO', 'PENDIENTE', 'RECHAZADO']));
  });

  it('calcula antigüedad completa con fecha de referencia explícita', () => {
    expect(calcularAntiguedad('2022-03-15', '2026-10-19')).toEqual({ anios: 4, meses: 7, dias: 4 });
    expect(calcularAntiguedad('2026-10-19', '2026-10-19')).toEqual({ anios: 0, meses: 0, dias: 0 });
    expect(calcularAntiguedad('2020-02-29', '2021-02-28')).toEqual({ anios: 1, meses: 0, dias: 0 });
    expect(calcularAntiguedad('2026-01-31', '2026-03-01')).toEqual({ anios: 0, meses: 1, dias: 1 });
  });

  it('rechaza fechas inválidas y futuras', () => {
    expect(() => calcularAntiguedad('2026-02-30', '2026-10-19')).toThrow();
    expect(() => calcularAntiguedad('2027-01-01', '2026-10-19')).toThrow();
    expect(() => calcularAntiguedad('incorrecta', '2026-10-19')).toThrow();
  });

  it('permite configurar la base sin fijarla a cinco', () => {
    expect(calcularUmbrales(categoriasMock[0]).map(i => i.umbral)).toEqual([5, 8, 12]);
    expect(calcularUmbrales({ ...categoriasMock[0], umbralBronce: 4 }).map(i => i.umbral)).toEqual([4, 6, 9]);
    for (const base of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      expect(() => calcularUmbrales({ ...categoriasMock[0], umbralBronce: base })).toThrow();
    }
  });

  it.each([
    [0, null, 'BRONCE'], [4, null, 'BRONCE'], [5, 'BRONCE', 'PLATA'],
    [7, 'BRONCE', 'PLATA'], [8, 'PLATA', 'ORO'], [11, 'PLATA', 'ORO'],
    [12, 'ORO', null], [13, 'ORO', null],
  ])('con %i estrellas conserva la mayor insignia y próxima meta', (cantidad, actual, siguiente) => {
    const plantilla = reconocimientosMock[0];
    const datos = Array.from({ length: cantidad }, (_, i) => ({ ...plantilla, id: `test-${i}` }));
    const progreso = calcularProgreso('col-1', categoriasMock[0], datos);
    expect(progreso.estrellas).toBe(cantidad);
    expect(progreso.insigniaActual?.nivel ?? null).toBe(actual);
    expect(progreso.proximaInsignia?.nivel ?? null).toBe(siguiente);
    expect(progreso.porcentajeAvance).toBeGreaterThanOrEqual(0);
    expect(progreso.porcentajeAvance).toBeLessThanOrEqual(100);
    if (!siguiente) expect(progreso.estrellasFaltantes).toBe(0);
  });

  it('solo cuenta aprobados del destinatario y categoría elegidos', () => {
    const escenario = crearEscenarioMock();
    expect(escenario.progresos.filter(p => p.colaboradorId === 'col-1').map(p => p.estrellas)).toEqual([12, 8, 5, 2, 0]);
    expect(escenario.progresos.filter(p => p.colaboradorId !== 'col-1').every(p => p.estrellas === 0 && p.insigniaActual === null)).toBe(true);
  });

  it('conserva ascensos cronológicos y estrellas sin reiniciar', () => {
    const progreso = calcularProgreso('col-1', categoriasMock[0], [...reconocimientosMock].reverse());
    expect(progreso.estrellas).toBe(12);
    expect(progreso.historialAscensos.map(a => a.insignia.nivel)).toEqual(['BRONCE', 'PLATA', 'ORO']);
    expect(progreso.historialAscensos.map(a => a.reconocimientoId)).toEqual(['certificaciones-05', 'certificaciones-08', 'certificaciones-12']);
    expect(progreso.porcentajeAvance).toBe(100);
  });

  it('mantiene referencias y decisiones People coherentes sin autorreconocimiento', () => {
    const personas = new Map(colaboradoresMock.map(c => [c.id, c]));
    for (const r of reconocimientosMock) {
      expect(personas.has(r.destinatarioId)).toBe(true);
      expect(categoriasMock.some(c => c.id === r.categoriaId)).toBe(true);
      if (r.origen === 'INTERNO') {
        expect(personas.has(r.emisorId)).toBe(true);
        expect(r.emisorId).not.toBe(r.destinatarioId);
      } else expect(personas.get(r.registradoPorId)?.rol).toBe('PEOPLE');
      if (r.estado !== 'PENDIENTE') {
        expect(personas.get(r.validadoPorId)?.rol).toBe('PEOPLE');
        expect(r.fechaDecision >= r.fecha).toBe(true);
      } else expect(r.fechaDecision).toBeUndefined();
    }
    expect(new Set(reconocimientosMock.map(r => r.id)).size).toBe(reconocimientosMock.length);
  });

  it('resume por mes de decisión e incluye ascensos del mes', () => {
    const octubre = calcularResumenMensual('col-1', '2026-10', categoriasMock, reconocimientosMock);
    expect(octubre.estrellasObtenidas).toBe(13);
    expect(octubre.reconocimientosAprobados).toBe(13);
    expect(octubre.estrellasPorCategoria.map(c => c.estrellas)).toEqual([8, 4, 1, 0, 0]);
    expect(octubre.insigniasObtenidas).toHaveLength(6);
    expect(calcularResumenMensual('col-1', '2026-08', categoriasMock, reconocimientosMock).estrellasObtenidas).toBe(0);
    expect(() => calcularResumenMensual('col-1', '2026-13', categoriasMock, reconocimientosMock)).toThrow();
  });

  it('entrega escenarios independientes y admite datos vacíos', () => {
    const escenario = crearEscenarioMock();
    escenario.categorias[0].umbralBronce = 4;
    expect(crearEscenarioMock().categorias[0].umbralBronce).toBe(5);
    expect(calcularProgreso('col-1', categoriasMock[0], []).estrellas).toBe(0);
    expect(calcularResumenMensual('col-1', '2026-10', [], []).insigniasObtenidas).toEqual([]);
  });
});
