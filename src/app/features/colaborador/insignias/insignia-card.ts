import { Component, input } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import type { Categoria, NivelInsignia, ProgresoCategoria } from '../../../core/models/impulsa.models';

@Component({
  selector: 'app-insignia-card', imports: [TitleCasePipe],
  templateUrl: './insignia-card.html', styleUrl: './insignia-card.css',
})
export class InsigniaCard {
  readonly imagenesMedalla: Record<NivelInsignia, string> = {
    BRONCE: 'images/insignias/bronce.png',
    PLATA: 'images/insignias/plata.png',
    ORO: 'images/insignias/oro.png',
    PLATINO: 'images/insignias/platino.png',
  };
  readonly categoria = input.required<Categoria>();
  readonly progreso = input.required<ProgresoCategoria>();
}
