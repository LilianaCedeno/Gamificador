import { Component, input, output } from '@angular/core';
import type { Colaborador } from '../../../core/models/impulsa.models';
import { AvatarPersona } from './avatar-persona';

@Component({
  selector: 'app-people-revision', imports: [AvatarPersona],
  templateUrl: './colaborador-revision.html', styleUrl: './colaborador-revision.css',
})
export class ColaboradorRevision {
  readonly persona = input.required<Colaborador>();
  readonly estrellas = input(0);
  readonly logros = input(0);
  readonly reconocimientos = input(0);
  readonly limpiar = output<void>();
}
