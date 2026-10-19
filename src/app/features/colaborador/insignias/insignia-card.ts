import { Component, input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import type { Categoria, ProgresoCategoria } from '../../../core/models/impulsa.models';

@Component({
  selector: 'app-insignia-card', imports: [TitleCasePipe],
  templateUrl: './insignia-card.html', styleUrl: './insignia-card.css',
})
export class InsigniaCard {
  readonly categoria = input.required<Categoria>();
  readonly progreso = input.required<ProgresoCategoria>();
}
