import { Injectable, signal } from '@angular/core';
import type { Categoria } from '../../../core/models/impulsa.models';

export const ICONOS_CATEGORIA = [
  { id: '', nombre: 'Sin icono', simbolo: '' },
  { id: 'libro', nombre: 'Libro', simbolo: '📖' },
  { id: 'estrella', nombre: 'Estrella', simbolo: '☆' },
  { id: 'idea', nombre: 'Idea', simbolo: '💡' },
  { id: 'personas', nombre: 'Personas', simbolo: '👥' },
] as const;
export type IconoCategoriaPeople = typeof ICONOS_CATEGORIA[number]['id'];
/** Metadato visual de People, sin alterar el contrato compartido ni las reglas de insignias. */
export interface CategoriaPeople extends Categoria { icono?: IconoCategoriaPeople; }
export interface BorradorCategoriaPeople {
  nombre: string; descripcion: string; activa: boolean; estrellasPorDefecto: number; icono: IconoCategoriaPeople;
}
export type ErroresCategoriaPeople = Partial<Record<keyof BorradorCategoriaPeople, string>>;

const normalizarNombre = (nombre: string) => nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');

export function validarCategoriaPeople(valor: BorradorCategoriaPeople, categorias: readonly CategoriaPeople[], id?: string): ErroresCategoriaPeople {
  const errores: ErroresCategoriaPeople = {};
  if (!valor.nombre.trim()) errores.nombre = 'El nombre es obligatorio.';
  else if (categorias.some(c => c.id !== id && normalizarNombre(c.nombre) === normalizarNombre(valor.nombre))) errores.nombre = 'Ya existe una categoría con este nombre, incluso si está inactiva.';
  if (!valor.descripcion.trim()) errores.descripcion = 'La descripción es obligatoria.';
  if (!Number.isInteger(valor.estrellasPorDefecto) || valor.estrellasPorDefecto < 1 || valor.estrellasPorDefecto > 5) errores.estrellasPorDefecto = 'Introduce un número entero de estrellas entre 1 y 5.';
  if (!ICONOS_CATEGORIA.some(i => i.id === valor.icono)) errores.icono = 'Selecciona una referencia visual disponible.';
  return errores;
}

@Injectable({ providedIn: 'root' })
export class CategoriasPeopleService {
  private readonly lista = signal<readonly CategoriaPeople[]>([]);
  private inicializada = false;
  private secuencia = 0;
  readonly categorias = this.lista.asReadonly();

  inicializar(categorias: readonly Categoria[]): void {
    if (this.inicializada) return;
    this.lista.set(categorias.map(c => ({ ...c })));
    this.inicializada = true;
  }

  guardar(valor: BorradorCategoriaPeople, id?: string): CategoriaPeople {
    if (!this.inicializada) throw new Error('Las categorías todavía no están disponibles.');
    const errores = validarCategoriaPeople(valor, this.lista(), id);
    if (Object.keys(errores).length) throw new Error(Object.values(errores).join(' '));
    const anterior = id ? this.lista().find(c => c.id === id) : null;
    if (id && !anterior) throw new Error('La categoría que intentas editar ya no está disponible.');
    let nuevoId = id;
    if (!nuevoId) {
      do { nuevoId = `categoria-demo-${++this.secuencia}`; } while (this.lista().some(c => c.id === nuevoId));
    }
    const categoria: CategoriaPeople = {
      ...anterior, id: nuevoId, nombre: valor.nombre.trim().replace(/\s+/g, ' '), descripcion: valor.descripcion.trim(),
      activa: valor.activa, estrellasPorDefecto: valor.estrellasPorDefecto,
      icono: valor.icono || undefined,
      // Campo legado obligatorio: se preserva al editar y no se configura desde esta vista.
      umbralBronce: anterior?.umbralBronce ?? 5,
    };
    this.lista.update(lista => id ? lista.map(c => c.id === id ? categoria : c) : [...lista, categoria]);
    return categoria;
  }
}
