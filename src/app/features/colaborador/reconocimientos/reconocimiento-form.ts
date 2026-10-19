import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Categoria, Colaborador, Evidencia } from '../../../core/models/impulsa.models';
import type { NuevoReconocimiento } from '../../../core/data-access/colaborador-data.service';

@Component({
  selector: 'app-reconocimiento-form', imports: [ReactiveFormsModule],
  templateUrl: './reconocimiento-form.html', styleUrl: './reconocimiento-form.css',
})
export class ReconocimientoForm {
  readonly companeros = input.required<readonly Colaborador[]>();
  readonly categorias = input.required<readonly Categoria[]>();
  readonly enviando = input(false);
  readonly enviar = output<NuevoReconocimiento>();
  readonly cancelar = output<void>();
  readonly formulario = new FormGroup({
    destinatarioId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    categoriaId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    motivo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(1000)] }),
    enlace: new FormControl('', { nonNullable: true }),
  });
  archivo: File | null = null;
  error = '';

  seleccionarArchivo(event: Event): void {
    this.archivo = null;
    this.error = '';
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    if (!(archivo.type === 'application/pdf' && /\.pdf$/i.test(archivo.name))
      && !(archivo.type === 'image/jpeg' && /\.jpe?g$/i.test(archivo.name))) {
      this.error = 'Selecciona un archivo PDF o JPG.';
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.archivo = archivo;
  }

  submit(): void {
    if (this.enviando()) return;
    this.error = '';
    this.formulario.markAllAsTouched();
    const valor = this.formulario.getRawValue();
    if (this.formulario.invalid || !valor.motivo.trim()
      || !this.companeros().some(c => c.id === valor.destinatarioId)
      || !this.categorias().some(c => c.id === valor.categoriaId && c.activa)) {
      this.error = 'Selecciona un compañero, una categoría y escribe un motivo de hasta 1000 caracteres.';
      return;
    }
    const evidencias: Evidencia[] = [];
    if (valor.enlace.trim()) {
      try {
        const url = new URL(valor.enlace.trim());
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
        evidencias.push({ id: 'enlace-demo', tipo: 'ENLACE', nombre: 'Enlace de respaldo', url: url.href });
      } catch { this.error = 'El enlace debe ser una URL completa HTTP o HTTPS.'; return; }
    }
    if (this.archivo) {
      const base = { id: 'archivo-demo', nombre: this.archivo.name, url: 'https://example.invalid/archivo-local-demo' };
      evidencias.push(this.archivo.type === 'application/pdf'
        ? { ...base, tipo: 'PDF', mimeType: 'application/pdf' }
        : { ...base, tipo: 'JPG', mimeType: 'image/jpeg' });
    }
    this.enviar.emit({ destinatarioId: valor.destinatarioId, categoriaId: valor.categoriaId, motivo: valor.motivo.trim(), evidencias });
  }
}
