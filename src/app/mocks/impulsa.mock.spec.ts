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

  it('usa los umbrales oficiales y no pondera estrellasPorDefecto', () => {
    expect(calcularUmbrales(categoriasMock[0]).map(i => i.umbral)).toEqual([5, 10, 15, 25]);
    const categoria = { ...categoriasMock[0], umbralBronce: 4, estrellasPorDefecto: 20 };
    expect(calcularUmbrales(categoria).map(i => i.umbral)).toEqual([5, 10, 15, 25]);
    expect(calcularProgreso('col-1', categoria, reconocimientosMock).estrellas).toBe(25);
  });

  it.each([
    [0, null, 'BRONCE'], [4, null, 'BRONCE'], [5, 'BRONCE', 'PLATA'],
    [9, 'BRONCE', 'PLATA'], [10, 'PLATA', 'ORO'], [14, 'PLATA', 'ORO'],
    [15, 'ORO', 'PLATINO'], [24, 'ORO', 'PLATINO'], [25, 'PLATINO', null], [26, 'PLATINO', null],
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
    expect(escenario.progresos.filter(p => p.colaboradorId === 'col-1').map(p => p.estrellas)).toEqual([25, 15, 10, 5, 0]);
    expect(escenario.progresos.filter(p => p.colaboradorId !== 'col-1').every(p => p.estrellas === 0 && p.insigniaActual === null)).toBe(true);
  });

  it('conserva ascensos cronológicos y estrellas sin reiniciar', () => {
    const progreso = calcularProgreso('col-1', categoriasMock[0], [...reconocimientosMock].reverse());
    expect(progreso.estrellas).toBe(25);
    expect(progreso.historialAscensos.map(a => a.insignia.nivel)).toEqual(['BRONCE', 'PLATA', 'ORO', 'PLATINO']);
    expect(progreso.historialAscensos.map(a => a.reconocimientoId)).toEqual(['certificaciones-05', 'certificaciones-10', 'certificaciones-15', 'certificaciones-25']);
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
    expect(octubre.estrellasObtenidas).toBe(39);
    expect(octubre.reconocimientosAprobados).toBe(39);
    expect(octubre.estrellasPorCategoria.map(c => c.estrellas)).toEqual([21, 11, 6, 1, 0]);
    expect(octubre.insigniasObtenidas).toHaveLength(10);
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
