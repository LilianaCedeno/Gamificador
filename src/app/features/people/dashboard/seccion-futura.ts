import { Component, input } from '@angular/core';
import type { Colaborador } from '../../../core/models/impulsa.models';

@Component({
  selector: 'app-people-seccion-futura', templateUrl: './seccion-futura.html', styleUrl: './seccion-futura.css',
})
export class SeccionFutura {
  readonly titulo = input.required<string>();
  readonly descripcion = input.required<string>();
  readonly persona = input<Colaborador | null>(null);
}
