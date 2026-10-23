import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PeopleConsulta } from './people-consulta';
import { PeopleDataService, type PanelPeopleData } from '../../../core/data-access/people-data.service';

describe('Resumen general e informes People', () => {
  let datos: PanelPeopleData;
  beforeEach(async () => { datos = await firstValueFrom(new PeopleDataService().cargar('2026-10')); });
  function preparar(modo: 'resumen' | 'informes' = 'resumen') {
    const f = TestBed.createComponent(PeopleConsulta);
    f.componentRef.setInput('datos', datos); f.componentRef.setInput('modo', modo); f.componentRef.setInput('mesInicial', '2026-10'); f.detectChanges();
    return f;
  }
  it('muestra indicadores calculados y filtra pendientes conservando el alcance general', () => {
    const f = preparar();
    expect(f.nativeElement.querySelector('[data-indicador="aprobados"]').textContent).toBe('39');
    expect(f.nativeElement.querySelector('[data-indicador="pendientes"]').textContent).toBe('1');
    const estado = f.nativeElement.querySelector('select') as HTMLSelectElement;
    estado.value = 'PENDIENTE'; estado.dispatchEvent(new Event('change')); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.registros > li')).toHaveLength(1);
    expect(f.nativeElement.querySelector('[data-indicador="aprobados"]').textContent).toBe('39');
    expect(f.nativeElement.querySelector('.registros button').textContent).toContain('Revisar pendiente');
    f.componentInstance.actualizar('mes', '2026-11'); f.detectChanges();
    expect(f.componentInstance.visibles()).toHaveLength(1);
    expect(f.nativeElement.textContent).toContain('No hay decisiones en el mes seleccionado.');
  });
  it('combina filtros, actualiza informes y estadísticas sin cambiar la muestra', () => {
    const copia = structuredClone(datos), f = preparar('informes');
    f.componentInstance.actualizar('colaboradorId', 'col-1');
    f.componentInstance.actualizar('categoriaId', 'capacitaciones');
    f.componentInstance.actualizar('estado', 'RECHAZADO');
    f.componentInstance.actualizar('desde', '2026-10-17'); f.componentInstance.actualizar('hasta', '2026-10-17'); f.detectChanges();
    expect(f.componentInstance.estadisticas()).toEqual({ total: 1, pendientes: 0, aprobados: 0, rechazados: 1, estrellas: 0 });
    expect(f.componentInstance.porColaborador()[0].nombre).toBe('Ana Ejemplo');
    expect(f.componentInstance.porCategoria()[0].nombre).toBe('Capacitaciones');
    expect(f.componentInstance.porMes()[0].mes).toBe('2026-10');
    f.componentInstance.actualizar('desde', '2026-11-01'); f.detectChanges();
    expect(f.nativeElement.querySelector('[role="alert"]').textContent).toContain('posterior');
    expect(f.componentInstance.visibles()).toHaveLength(0);
    f.componentInstance.limpiar(); f.detectChanges();
    expect(f.componentInstance.estadisticas().total).toBe(57);
    expect(f.componentInstance.estadisticas().estrellas).toBe(55);
    expect(datos).toEqual(copia);
    expect(f.nativeElement.textContent).toContain('Exportación a PDF y Excel · Próximamente');
  });
  it('muestra estados vacíos para consultas sin resultados', () => {
    const f = preparar('informes');
    f.componentRef.setInput('datos', { ...datos, reconocimientos: [] }); f.detectChanges();
    expect(f.componentInstance.estadisticas().total).toBe(0);
    expect(f.nativeElement.textContent).toContain('No hay reconocimientos para los filtros');
    expect(f.nativeElement.textContent).toContain('Sin datos para estos filtros.');
  });
});
