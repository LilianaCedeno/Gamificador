import { afterNextRender, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export const CLAVE_RECIENTES_PEOPLE = 'impulsa.people.consultas-demo';

/** Solo identificadores consultados; sesión de pestaña de demostración, independiente del login. */
@Injectable({ providedIn: 'root' })
export class PeopleRecientesService {
  private readonly documento = inject(DOCUMENT);
  private readonly ids = signal<readonly string[]>([]);
  readonly recientes = this.ids.asReadonly();

  constructor() {
    afterNextRender(() => {
      try {
        const guardados: unknown = JSON.parse(this.documento.defaultView?.sessionStorage.getItem(CLAVE_RECIENTES_PEOPLE) ?? '[]');
        if (Array.isArray(guardados)) this.ids.set([...new Set([...this.ids(), ...guardados.filter((id): id is string => typeof id === 'string' && !!id.trim())])].slice(0, 3));
      } catch { /* Sin almacenamiento, la sesión continúa en memoria. */ }
    });
  }

  registrar(id: string): void {
    this.ids.set([id, ...this.ids().filter(anterior => anterior !== id)].slice(0, 3));
    try { this.documento.defaultView?.sessionStorage.setItem(CLAVE_RECIENTES_PEOPLE, JSON.stringify(this.ids())); }
    catch { /* La consulta sigue funcionando sin almacenamiento. */ }
  }
}
