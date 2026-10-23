import { afterNextRender, Component, computed, effect, ElementRef, inject, Injector, input, output, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoriasPeopleService, ICONOS_CATEGORIA, validarCategoriaPeople, type BorradorCategoriaPeople, type CategoriaPeople, type ErroresCategoriaPeople, type IconoCategoriaPeople } from './categorias-people.service';

const formularioInicial = () => ({ nombre: '', descripcion: '', activa: true, estrellasPorDefecto: 1, icono: '' as IconoCategoriaPeople });

@Component({
  selector: 'app-people-gestion-categorias', imports: [ReactiveFormsModule],
  templateUrl: './gestion-categorias.html', styleUrl: './gestion-categorias.css',
})
export class GestionCategorias {
  readonly servicio = inject(CategoriasPeopleService);
  private readonly elemento: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  readonly solicitud = input(0);
  readonly volver = output<void>();
  readonly iconos = ICONOS_CATEGORIA;
  readonly editandoId = signal<string | null>(null);
  readonly errores = signal<ErroresCategoriaPeople>({});
  readonly errorGeneral = signal('');
  readonly confirmacion = signal('');
  readonly consulta = signal('');
  readonly categoriasFiltradas = computed(() => {
    const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
    const consulta = normalizar(this.consulta());
    return this.servicio.categorias().filter(c => !consulta || normalizar(c.nombre).includes(consulta) || normalizar(c.descripcion).includes(consulta));
  });
  readonly formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    activa: new FormControl(true, { nonNullable: true }),
    estrellasPorDefecto: new FormControl<number | null>(1, [Validators.required, Validators.min(1), Validators.max(5)]),
    icono: new FormControl<IconoCategoriaPeople>('', { nonNullable: true }),
  });

  constructor() {
    this.formulario.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.errores.set({}); this.errorGeneral.set(''); this.confirmacion.set('');
    });
    effect(() => { this.solicitud(); untracked(() => this.cancelar()); });
  }

  referencia(icono?: string) { return this.iconos.find(i => i.id === icono) ?? this.iconos[0]; }

  editar(categoria: CategoriaPeople): void {
    this.conservarPosicionLista();
    this.editandoId.set(categoria.id);
    this.formulario.reset({ nombre: categoria.nombre, descripcion: categoria.descripcion, activa: categoria.activa,
      estrellasPorDefecto: categoria.estrellasPorDefecto, icono: categoria.icono ?? '' });
    this.enfocarNombre();
  }

  cancelar(enfocar = false): void {
    this.editandoId.set(null); this.formulario.reset(formularioInicial());
    if (enfocar) this.enfocarNombre();
  }

  guardar(): void {
    this.formulario.markAllAsTouched(); this.errorGeneral.set(''); this.confirmacion.set('');
    const raw = this.formulario.getRawValue();
    const valor: BorradorCategoriaPeople = { ...raw, estrellasPorDefecto: raw.estrellasPorDefecto ?? NaN };
    const errores = validarCategoriaPeople(valor, this.servicio.categorias(), this.editandoId() ?? undefined);
    this.errores.set(errores);
    if (Object.keys(errores).length) {
      this.errorGeneral.set('Revisa los campos indicados antes de continuar.');
      this.enfocarCampo('[aria-invalid="true"]');
      return;
    }
    try {
      this.conservarPosicionLista();
      const eraEdicion = !!this.editandoId();
      const categoria = this.servicio.guardar(valor, this.editandoId() ?? undefined);
      this.cancelar();
      this.confirmacion.set(`Categoría «${categoria.nombre}» ${eraEdicion ? 'actualizada' : 'creada'}.`);
    } catch (error) { this.errorGeneral.set(error instanceof Error ? error.message : 'No se pudo guardar la categoría.'); }
  }

  private enfocarNombre(): void {
    this.enfocarCampo('#categoria-nombre', true);
  }

  buscar(valor: string): void {
    this.consulta.set(valor);
    afterNextRender(() => {
      const lista = this.elemento.nativeElement.querySelector<HTMLElement>('.lista-categorias');
      if (lista) lista.scrollTop = 0;
    }, { injector: this.injector });
  }

  limpiarBusqueda(): void {
    this.buscar('');
    this.elemento.nativeElement.querySelector<HTMLElement>('#buscar-categorias')?.focus({ preventScroll: true });
  }

  private conservarPosicionLista(): void {
    const lista = this.elemento.nativeElement.querySelector<HTMLElement>('.lista-categorias');
    const posicion = lista?.scrollTop ?? 0;
    afterNextRender(() => { if (lista?.isConnected) lista.scrollTop = posicion; }, { injector: this.injector });
  }

  private enfocarCampo(selector: string, inicio = false): void {
    afterNextRender(() => {
      const campo = this.elemento.nativeElement.querySelector<HTMLElement>(selector);
      const panel = this.elemento.nativeElement.querySelector<HTMLElement>('.formulario-panel');
      const escritorio = this.elemento.nativeElement.ownerDocument.defaultView?.matchMedia?.('(min-width: 1051px) and (min-height: 601px)').matches ?? false;
      if (escritorio && panel && campo) {
        if (inicio) panel.scrollTop = 0;
        campo.focus({ preventScroll: true });
        const campoRect = campo.getBoundingClientRect(), panelRect = panel.getBoundingClientRect();
        if (campoRect.top < panelRect.top) panel.scrollTop += campoRect.top - panelRect.top - 12;
        else if (campoRect.bottom > panelRect.bottom) panel.scrollTop += campoRect.bottom - panelRect.bottom + 12;
      } else campo?.focus();
    }, { injector: this.injector });
  }
}
