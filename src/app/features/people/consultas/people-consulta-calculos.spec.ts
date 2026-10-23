import { reconocimientosMock } from '../../../mocks/impulsa.mock';
import { estadisticasConsultaPeople, fechaConsultaPeople, filtrarConsultaPeople, validarFiltrosPeople, type FiltrosConsultaPeople } from './people-consulta-calculos';

describe('Consulta People de solo lectura', () => {
  const filtros: FiltrosConsultaPeople = { mes: '2026-10', desde: '', hasta: '', colaboradorId: '', categoriaId: '', estado: '' };
  it('conserva el criterio de resumen existente y aplica estado sin alterar los registros', () => {
    const copia = structuredClone(reconocimientosMock);
    expect(estadisticasConsultaPeople(filtrarConsultaPeople(reconocimientosMock, filtros, true)))
      .toEqual({ total: 41, pendientes: 1, aprobados: 39, rechazados: 1, estrellas: 39 });
    expect(filtrarConsultaPeople(reconocimientosMock, { ...filtros, mes: '2026-11', estado: 'PENDIENTE' }, true)).toHaveLength(1);
    expect(filtrarConsultaPeople(reconocimientosMock, { ...filtros, mes: '2026-11' })).toHaveLength(0);
    expect(reconocimientosMock).toEqual(copia);
  });
  it('combina destinatario, categoría, estado, mes y rango de fechas en UTC', () => {
    const seleccion = filtrarConsultaPeople(reconocimientosMock, { ...filtros, colaboradorId: 'col-1', categoriaId: 'capacitaciones', estado: 'RECHAZADO', desde: '2026-10-17', hasta: '2026-10-17' });
    expect(seleccion.map(r => r.id)).toEqual(['rechazado-1']);
    expect(estadisticasConsultaPeople(seleccion).estrellas).toBe(0);
    expect(filtrarConsultaPeople(reconocimientosMock, { ...filtros, colaboradorId: 'col-2', estado: 'APROBADO' })).toHaveLength(0);
  });
  it('incluye límites y normaliza offsets, permite todos los meses y comunica filtros inválidos', () => {
    const base = reconocimientosMock.find(r => r.estado === 'APROBADO')!;
    if (base.estado === 'PENDIENTE') throw new Error('La prueba requiere un reconocimiento resuelto');
    const datos = [{ ...base, id: 'a', fechaDecision: '2026-09-30T22:00:00-03:00' }, { ...base, id: 'b', fechaDecision: '2026-10-01T23:59:59Z' }];
    expect(filtrarConsultaPeople(datos, { ...filtros, desde: '2026-10-01', hasta: '2026-10-01' })).toHaveLength(2);
    expect(estadisticasConsultaPeople(filtrarConsultaPeople(reconocimientosMock, { ...filtros, mes: '' })).total).toBe(57);
    expect(validarFiltrosPeople({ ...filtros, desde: '2026-10-22', hasta: '2026-10-01' })).toContain('posterior');
    expect(validarFiltrosPeople({ ...filtros, desde: '2026-02-30' })).toContain('válidas');
    expect(filtrarConsultaPeople(datos, { ...filtros, mes: '2026-13' })).toEqual([]);
    expect(fechaConsultaPeople({ ...base, fechaDecision: 'inválida' })).toBe(new Date(base.fecha).toISOString());
    expect(fechaConsultaPeople({ ...base, fechaDecision: 'inválida', fecha: 'inválida' })).toBeNull();
  });
});
