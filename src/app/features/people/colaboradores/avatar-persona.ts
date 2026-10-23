import { Component, computed, input, signal } from '@angular/core';
import type { Colaborador } from '../../../core/models/impulsa.models';

@Component({
  selector: 'app-people-avatar', templateUrl: './avatar-persona.html', styleUrl: './avatar-persona.css',
})
export class AvatarPersona {
  readonly persona = input.required<Colaborador>();
  readonly fotoFallida = signal('');
  readonly claveFoto = computed(() => `${this.persona().id}|${this.persona().fotografiaUrl}`);
  readonly iniciales = computed(() => `${this.persona().nombre.slice(0, 1)}${this.persona().apellido.slice(0, 1)}`.toLocaleUpperCase('es'));
  readonly mostrarFoto = computed(() => {
    const url = this.persona().fotografiaUrl;
    // Las URL ficticias .invalid no se solicitan como si fueran fotos disponibles.
    return !!url && !/^https?:\/\/[^/]+\.invalid(?:\/|$)/i.test(url) && this.fotoFallida() !== this.claveFoto();
  });
}
