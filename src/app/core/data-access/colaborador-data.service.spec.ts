import { firstValueFrom } from 'rxjs';
import { ColaboradorDataService } from './colaborador-data.service';

describe('ColaboradorDataService', () => {
  let servicio: ColaboradorDataService;
  beforeEach(() => { servicio = new ColaboradorDataService(); });

  it('carga perfil, progreso e historial personal coherentes', async () => {
    const d = await firstValueFrom(servicio.cargar());
    expect(d.antiguedad).toEqual({ anios: 4, meses: 7, dias: 4 });
    expect(d.progresos.map(p => p.estrellas)).toEqual([25, 15, 10, 5, 0]);
    expect(d.resumen.estrellasObtenidas).toBe(39);
    expect(d.companeros.some(c => c.id === d.perfil.id)).toBe(false);
    expect(d.historial).toHaveLength(57);
  });

  it('admite vacío, error y recuperación', async () => {
    const d = await firstValueFrom(servicio.cargar('vacio'));
    expect(d.historial).toEqual([]);
    expect(d.progresos.every(p => p.estrellas === 0 && p.insigniaActual === null)).toBe(true);
    await expect(firstValueFrom(servicio.cargar('error'))).rejects.toThrow();
    expect((await firstValueFrom(servicio.cargar())).historial.length).toBeGreaterThan(0);
  });

  it('envía un pendiente independiente sin sumar estrellas ni persistir entre servicios', async () => {
    const d = await firstValueFrom(servicio.reconocer({ destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: ' Gracias ', evidencias: [] }));
    const r = d.historial.find(r => r.id === 'demo-nuevo-1')!;
    expect(r.estado).toBe('PENDIENTE');
    expect(r.motivo).toBe('Gracias');
    expect(r.fechaDecision).toBeUndefined();
    expect(d.progresos.reduce((s, p) => s + p.estrellas, 0)).toBe(55);
    expect((await firstValueFrom(new ColaboradorDataService().cargar())).historial).toHaveLength(57);
  });

  it('rechaza autorreconocimiento, referencias inválidas, motivo vacío y enlaces inseguros', async () => {
    const base = { destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: 'Gracias', evidencias: [] };
    for (const nuevo of [
      { ...base, destinatarioId: 'col-1' }, { ...base, destinatarioId: 'inexistente' },
      { ...base, categoriaId: 'inexistente' }, { ...base, motivo: '  ' }, { ...base, motivo: 'x'.repeat(1001) },
      { ...base, evidencias: [{ id: 'e', tipo: 'ENLACE' as const, nombre: 'Evidencia', url: 'javascript:alert(1)' }] },
    ]) await expect(firstValueFrom(servicio.reconocer(nuevo))).rejects.toThrow();
  });

  it('entrega copias que no modifican el escenario base', async () => {
    const d = await firstValueFrom(servicio.cargar());
    d.perfil.nombre = 'Modificado';
    expect((await firstValueFrom(servicio.cargar())).perfil.nombre).toBe('Ana');
  });
});
