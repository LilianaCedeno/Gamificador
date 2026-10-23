import { calcularActividadPeople, ordenarCategoriasPeople } from './people-presentacion';
import { categoriasMock, reconocimientosMock } from '../../../mocks/impulsa.mock';
import type { Reconocimiento } from '../../../core/models/impulsa.models';

describe('Indicadores de presentación People', () => {
  const registro = (fecha: string, destinatarioId = 'col-1'): Reconocimiento => ({ ...reconocimientosMock[0], fecha, destinatarioId });

  it('usa registro, destinatario y todos los estados sin alterar estrellas ni datos', () => {
    const copia = structuredClone(reconocimientosMock);
    const resultado = calcularActividadPeople(reconocimientosMock, 'col-1', new Date('2026-10-22T12:00:00Z'));
    expect(resultado).toMatchObject({ semana: 0, actual: 1, anterior: 55, mesActual: '2026-10', mesAnterior: '2026-09' });
    expect(resultado.variacion).toBeCloseTo(-98.181818);
    expect(calcularActividadPeople(reconocimientosMock, 'col-2', new Date('2026-10-22T12:00:00Z'))).toMatchObject({ actual: 1, anterior: 0, variacion: null });
    expect(reconocimientosMock).toEqual(copia);
  });

  it('respeta lunes UTC, cambio de mes/año, límites, zonas horarias y excluye fechas futuras o inválidas', () => {
    const datos = [
      registro('2026-12-31T23:59:59Z'), registro('2027-01-01T00:00:00Z'),
      registro('2027-01-03T23:59:59Z'), registro('2027-01-04T00:00:00Z'),
      registro('2027-01-03T22:00:00-03:00'), registro('2027-01-04T12:00:01Z'),
      registro('inválida'), registro('2027-01-04T09:00:00Z', 'col-2'),
      registro('2026-11-30T23:59:59Z'),
    ];
    expect(calcularActividadPeople(datos, 'col-1', new Date('2027-01-04T12:00:00Z')))
      .toMatchObject({ semana: 2, actual: 4, anterior: 1, variacion: 300, sinFecha: 1, inicioSemana: '2027-01-04T00:00:00.000Z' });
    expect(calcularActividadPeople(datos, 'col-1', new Date('2027-01-03T23:59:59Z')).semana).toBe(3);
  });

  it('no fabrica porcentajes cuando no existe base y representa la caída a cero', () => {
    expect(calcularActividadPeople([], null, new Date('2026-10-22T12:00:00Z'))).toMatchObject({ actual: 0, anterior: 0, semana: 0, variacion: null });
    expect(calcularActividadPeople([registro('2026-09-01T00:00:00Z')], 'col-1', new Date('2026-10-22T12:00:00Z')).variacion).toBe(-100);
  });

  it('ordena por frecuencia de la muestra y conserva categorías y orden estable sin uso o en empates', () => {
    expect(ordenarCategoriasPeople(categoriasMock, reconocimientosMock).categorias.slice(0, 4).map(c => c.id))
      .toEqual(['certificaciones', 'clientes', 'innovacion', 'mentorias']);
    expect(ordenarCategoriasPeople(categoriasMock, [])).toEqual({ categorias: categoriasMock, hayUso: false });
    const empate = categoriasMock.map(c => ({ ...registro('2026-10-01'), categoriaId: c.id }));
    expect(ordenarCategoriasPeople(categoriasMock, empate).categorias).toEqual(categoriasMock);
    expect(categoriasMock).toHaveLength(5);
  });
});
