import { Injectable } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';
import type { Colaborador } from '../models/impulsa.models';
import { colaboradoresMock } from '../../mocks/impulsa.mock';

export interface IdentidadPeople {
  persona: Colaborador;
  origen: 'DEMOSTRACION' | 'SESION';
}

/** Punto de sustitución por un adaptador de sesión cuando exista perfil/rol verificable. */
@Injectable({ providedIn: 'root' })
export class PeopleIdentidadService {
  obtener(): Observable<IdentidadPeople> {
    return defer(() => {
      const persona = colaboradoresMock.find(c => c.rol === 'PEOPLE');
      if (!persona) return throwError(() => new Error('No hay identidad People de demostración.'));
      // No inferir identidad por username, estado de login ni colaborador en revisión.
      return of({ persona: structuredClone(persona), origen: 'DEMOSTRACION' as const });
    });
  }
}
