import { afterNextRender, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type TemaImpulsa = 'oscuro' | 'claro';
export const CLAVE_TEMA_IMPULSA = 'impulsa.preferencia-tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);
  private readonly seleccion = signal<TemaImpulsa>('oscuro');
  readonly tema = this.seleccion.asReadonly();

  constructor() {
    // Evita diferencias servidor/cliente durante hidratación. No lee sesiones o tokens.
    afterNextRender(() => {
      try {
        const guardado = this.documento.defaultView?.localStorage.getItem(CLAVE_TEMA_IMPULSA);
        if (guardado === 'claro' || guardado === 'oscuro') this.seleccion.set(guardado);
      } catch { /* La preferencia sigue disponible en memoria si el almacenamiento está bloqueado. */ }
    });
  }

  alternar(): void {
    this.seleccion.update(actual => actual === 'oscuro' ? 'claro' : 'oscuro');
    try {
      this.documento.defaultView?.localStorage.setItem(CLAVE_TEMA_IMPULSA, this.tema());
    } catch { /* No interrumpe la interacción ni afecta autenticación. */ }
  }
}
