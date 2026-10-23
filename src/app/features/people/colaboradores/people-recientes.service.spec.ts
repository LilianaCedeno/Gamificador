import { TestBed } from '@angular/core/testing';
import { PeopleRecientesService, CLAVE_RECIENTES_PEOPLE } from './people-recientes.service';
import { ColaboradoresPanel } from './colaboradores-panel';
import { colaboradoresMock } from '../../../mocks/impulsa.mock';

describe('Recientes de la sesión de demostración People', () => {
  afterEach(() => sessionStorage.removeItem(CLAVE_RECIENTES_PEOPLE));
  function preparar() {
    const servicio = TestBed.inject(PeopleRecientesService);
    const f = TestBed.createComponent(ColaboradoresPanel);
    f.componentRef.setInput('colaboradores', colaboradoresMock); f.detectChanges();
    return { servicio, f };
  }
  it('conserva tres únicos en orden de consulta y persiste solo identificadores', () => {
    sessionStorage.removeItem(CLAVE_RECIENTES_PEOPLE);
    const { servicio } = preparar();
    for (const id of ['col-1', 'col-2', 'people-1', 'col-1']) servicio.registrar(id);
    expect(servicio.recientes()).toEqual(['col-1', 'people-1', 'col-2']);
    expect(JSON.parse(sessionStorage.getItem(CLAVE_RECIENTES_PEOPLE)!)).toEqual(['col-1', 'people-1', 'col-2']);
  });
  it('restaura recientes al remontar People en la misma sesión sin aceptar duplicados ni valores corruptos', async () => {
    sessionStorage.setItem(CLAVE_RECIENTES_PEOPLE, JSON.stringify(['col-2', 'col-2', 12, 'col-1', 'people-1', 'fuera']));
    const { servicio, f } = preparar(); await f.whenStable();
    expect(servicio.recientes()).toEqual(['col-2', 'col-1', 'people-1']);
  });
  it('tolera datos de almacenamiento inválidos', async () => {
    sessionStorage.setItem(CLAVE_RECIENTES_PEOPLE, '{');
    const { servicio, f } = preparar(); await f.whenStable();
    expect(servicio.recientes()).toEqual([]);
    servicio.registrar('col-1'); expect(servicio.recientes()).toEqual(['col-1']);
  });
});
