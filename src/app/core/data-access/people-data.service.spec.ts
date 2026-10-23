import { firstValueFrom } from 'rxjs';
import { PeopleDataService, calcularIndicadoresPeople } from './people-data.service';
import { PeopleIdentidadService } from './people-identidad.service';
import { reconocimientosMock } from '../../mocks/impulsa.mock';
import type { Reconocimiento } from '../models/impulsa.models';

describe('People: lectura de mocks e indicadores', () => {
  it('calcula octubre por fecha de decisión, no por fecha de registro', () => {
    const indicadores = calcularIndicadoresPeople(reconocimientosMock, '2026-10');
    expect(indicadores).toEqual({ pendientes: 1, aprobadosMes: 39, rechazadosMes: 1, decisionesSinFechaValida: 0, decisionesSinFechaEnMes: 0 });
    expect(calcularIndicadoresPeople(reconocimientosMock, '2026-09').aprobadosMes).toBe(16);
    expect(calcularIndicadoresPeople(reconocimientosMock, '2026-11')).toEqual({ pendientes: 1, aprobadosMes: 0, rechazadosMes: 0, decisionesSinFechaValida: 0, decisionesSinFechaEnMes: 0 });
  });
  it('explicita el uso de fecha de registro si falta una decisión válida', () => {
    const aprobado = reconocimientosMock.find(r => r.estado === 'APROBADO')!;
    const sinFecha: Reconocimiento = { ...aprobado, estado: 'APROBADO', validadoPorId: 'people-1', fechaDecision: '', fecha: '2026-10-03T12:00:00Z' };
    const resultado = calcularIndicadoresPeople([sinFecha], '2026-10');
    expect(resultado.aprobadosMes).toBe(1);
    expect(resultado.decisionesSinFechaValida).toBe(1);
    expect(resultado.decisionesSinFechaEnMes).toBe(1);
    expect(calcularIndicadoresPeople([{ ...sinFecha, fecha: 'sin fecha' }], '2026-10').aprobadosMes).toBe(0);
  });
  it('normaliza el límite mensual en UTC y rechaza meses inválidos', () => {
    const r: Reconocimiento = {
      id: 'limite', origen: 'INTERNO', emisorId: 'col-2', destinatarioId: 'col-1', categoriaId: 'certificaciones',
      motivo: 'Prueba de límite mensual', fecha: '2026-09-01T12:00:00Z', evidencias: [],
      estado: 'APROBADO', validadoPorId: 'people-1', fechaDecision: '2026-11-01T00:30:00+02:00',
    };
    expect(calcularIndicadoresPeople([r], '2026-10').aprobadosMes).toBe(1);
    expect(calcularIndicadoresPeople([r], '2026-11').aprobadosMes).toBe(0);
    for (const mes of ['', '2026-13', '2026-1']) expect(() => calcularIndicadoresPeople([], mes)).toThrow();
  });
  it('admite vacío, error y copias independientes sin modificar los mocks', async () => {
    const servicio = new PeopleDataService();
    const d = await firstValueFrom(servicio.cargar('2026-10'));
    expect(d.colaboradores).toHaveLength(3);
    expect(d.categorias).toHaveLength(5);
    d.colaboradores[0].nombre = 'Cambio de prueba';
    expect((await firstValueFrom(servicio.cargar('2026-10'))).colaboradores[0].nombre).toBe('Ana');
    const vacio = await firstValueFrom(servicio.cargar('2026-10', 'vacio'));
    expect(vacio.colaboradores).toEqual([]);
    expect(vacio.indicadores.pendientes).toBe(0);
    await expect(firstValueFrom(servicio.cargar('2026-10', 'error'))).rejects.toThrow();
    await expect(firstValueFrom(servicio.cargar('invalido'))).rejects.toThrow();
  });
  it('expone una identidad People de demostración sin convertirla en sesión real', async () => {
    const servicio = new PeopleIdentidadService();
    const identidad = await firstValueFrom(servicio.obtener());
    expect(identidad.origen).toBe('DEMOSTRACION');
    expect(identidad.persona.rol).toBe('PEOPLE');
    expect(identidad.persona.nombre).toBe('Sara');
    identidad.persona.nombre = 'Cambio aislado';
    expect((await firstValueFrom(servicio.obtener())).persona.nombre).toBe('Sara');
  });
});
