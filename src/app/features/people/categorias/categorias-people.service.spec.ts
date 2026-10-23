import { CategoriasPeopleService, type BorradorCategoriaPeople } from './categorias-people.service';
import { crearEscenarioMock, categoriasMock } from '../../../mocks/impulsa.mock';
import { calcularProgreso, calcularResumenMensual, calcularUmbrales } from '../../../mocks/impulsa-calculos.mock';

describe('Categorías People en memoria', () => {
  const nuevo: BorradorCategoriaPeople = { nombre: 'Categoría de prueba', descripcion: 'Descripción de prueba', activa: true, estrellasPorDefecto: 2, icono: 'libro' };
  function preparar() { const s = new CategoriasPeopleService(); s.inicializar(categoriasMock); return s; }

  it('inicia con las cinco categorías y crea sin alterar los mocks; otra sesión vuelve a los valores iniciales', () => {
    const copia = structuredClone(categoriasMock), s = preparar();
    expect(s.categorias()).toEqual(categoriasMock);
    const creada = s.guardar(nuevo);
    expect(s.categorias()).toHaveLength(6);
    expect(creada).toMatchObject({ ...nuevo, umbralBronce: 5 });
    expect(categoriasMock).toEqual(copia);
    s.inicializar(categoriasMock); expect(s.categorias()).toHaveLength(6);
    expect(preparar().categorias()).toEqual(categoriasMock);
  });

  it('valida obligatorios, duplicados normalizados e inactivos y rango entero 1–5', () => {
    const s = preparar(), copia = structuredClone(s.categorias());
    for (const nombre of ['', '   ', ' CERTIFICACIONES ', '  mentorias ']) expect(() => s.guardar({ ...nuevo, nombre })).toThrow();
    expect(() => s.guardar({ ...nuevo, descripcion: '   ' })).toThrow('descripción');
    for (const estrellasPorDefecto of [0, 6, 1.5, NaN, Infinity]) expect(() => s.guardar({ ...nuevo, estrellasPorDefecto })).toThrow('entre 1 y 5');
    expect(s.categorias()).toEqual(copia);
    const actual = s.categorias()[0];
    s.guardar({ ...actual, icono: '', activa: false }, actual.id);
    expect(() => s.guardar({ ...nuevo, nombre: actual.nombre })).toThrow('inactiva');
    expect(() => s.guardar({ ...nuevo, nombre: 'Otro nombre' }, 'id-inexistente')).toThrow('no está disponible');
    expect(s.guardar({ ...nuevo, nombre: 'Mínimo', estrellasPorDefecto: 1 }).estrellasPorDefecto).toBe(1);
    expect(s.guardar({ ...nuevo, nombre: 'Máximo', estrellasPorDefecto: 5 }).estrellasPorDefecto).toBe(5);
  });

  it('edita y reactiva conservando ID, historial, estrellas por aprobación y umbrales oficiales', () => {
    const d = crearEscenarioMock(), copia = structuredClone(d), s = preparar(), original = s.categorias()[0];
    const progreso = calcularProgreso('col-1', original, d.reconocimientos);
    const resumen = calcularResumenMensual('col-1', '2026-10', s.categorias(), d.reconocimientos);
    const modificada = s.guardar({ ...original, nombre: 'Certificaciones actualizadas', activa: false, estrellasPorDefecto: 5, icono: 'estrella' }, original.id);
    expect(modificada.id).toBe(original.id);
    expect(s.categorias()).toHaveLength(5);
    expect(modificada.activa).toBe(false);
    expect(calcularProgreso('col-1', modificada, d.reconocimientos)).toEqual(progreso);
    expect(progreso.estrellas).toBe(25);
    expect(calcularUmbrales(modificada).map(i => i.umbral)).toEqual([5, 10, 15, 25]);
    expect(calcularResumenMensual('col-1', '2026-10', s.categorias(), d.reconocimientos)).toEqual(resumen);
    expect(d).toEqual(copia);
    expect(s.guardar({ ...modificada, activa: true, icono: 'estrella' }, original.id).activa).toBe(true);
    expect(() => s.guardar({ ...nuevo, nombre: s.categorias()[1].nombre }, original.id)).toThrow('Ya existe');
  });
});
