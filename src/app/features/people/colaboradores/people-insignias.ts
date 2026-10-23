import { Component, input } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import type { Categoria, ProgresoCategoria } from '../../../core/models/impulsa.models';

@Component({
  selector: 'app-people-insignias', imports: [DatePipe, TitleCasePipe],
  templateUrl: './people-insignias.html', styleUrl: './people-insignias.css',
})
export class PeopleInsignias {
  readonly items = input.required<readonly { categoria: Categoria; progreso: ProgresoCategoria }[]>();
  readonly resumen = input(false);
}
