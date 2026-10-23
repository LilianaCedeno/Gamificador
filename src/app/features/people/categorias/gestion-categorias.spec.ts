import { TestBed } from '@angular/core/testing';
import { GestionCategorias } from './gestion-categorias';
import { CategoriasPeopleService } from './categorias-people.service';
import { categoriasMock } from '../../../mocks/impulsa.mock';

describe('Gestión de Categorías People', () => {
  function preparar() {
    const servicio = TestBed.inject(CategoriasPeopleService); servicio.inicializar(categoriasMock);
    const f = TestBed.createComponent(GestionCategorias); f.detectChanges();
    return { f, servicio };
  }
  function escribir(f: ReturnType<typeof preparar>['f'], id: string, valor: string) {
    const input = f.nativeElement.querySelector('#' + id) as HTMLInputElement;
    input.value = valor; input.dispatchEvent(new Event('input', { bubbles: true })); f.detectChanges();
  }
  function guardar(f: ReturnType<typeof preparar>['f']) {
    f.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); f.detectChanges();
  }

  it('muestra cinco categorías y conserva el selector de icono sin vista previa', () => {
    const { f } = preparar();
    expect(f.nativeElement.querySelectorAll('.lista-categorias > li')).toHaveLength(5);
    expect(f.nativeElement.querySelectorAll('.lista-categorias button')).toHaveLength(5);
    expect(f.nativeElement.querySelector('button[type="submit"]').textContent).toContain('Crear categoría');
    expect(f.nativeElement.querySelector('input[required]')).not.toBeNull();
    expect(f.nativeElement.querySelector('.gestion-encabezado p')).toBeNull();
    expect(f.nativeElement.querySelector('.lista-categorias').textContent).toContain('Estrellas por defecto: 1');
    expect(f.nativeElement.querySelector('button[type="submit"]').disabled).toBe(false);
    expect(f.nativeElement.querySelector('#categoria-icono')).not.toBeNull();
    expect(f.nativeElement.querySelector('.vista-previa')).toBeNull();
    expect(f.nativeElement.textContent).not.toContain('Vista previa');
  });

  it('crea desde el formulario, actualiza listado y confirma en una región accesible', () => {
    const { f, servicio } = preparar();
    escribir(f, 'categoria-nombre', '  Colaboración de prueba  ');
    escribir(f, 'categoria-descripcion', 'Descripción de la categoría de prueba');
    escribir(f, 'categoria-estrellas', '3');
    const icono = f.nativeElement.querySelector('#categoria-icono') as HTMLSelectElement;
    icono.value = 'libro'; icono.dispatchEvent(new Event('change')); f.detectChanges();
    expect(icono.value).toBe('libro');
    expect(f.nativeElement.querySelector('.vista-previa')).toBeNull();
    guardar(f);
    expect(servicio.categorias()).toHaveLength(6);
    expect(servicio.categorias().at(-1)).toMatchObject({ nombre: 'Colaboración de prueba', estrellasPorDefecto: 3, icono: 'libro' });
    expect(f.nativeElement.querySelectorAll('.lista-categorias > li')).toHaveLength(6);
    expect(f.nativeElement.querySelector('.lista-categorias > li:last-child [role="img"]').getAttribute('aria-label')).toBe('Libro');
    expect(f.nativeElement.querySelector('[role="status"]').textContent).toContain('creada.');
    expect(f.componentInstance.formulario.controls.nombre.value).toBe('');
  });

  it('comunica errores de obligatorios, duplicados y rango sin guardar ni perder el borrador', async () => {
    const { f, servicio } = preparar();
    guardar(f); await f.whenStable();
    expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(f.nativeElement.querySelector('#categoria-error-nombre').textContent).toContain('obligatorio');
    expect(document.activeElement?.id).toBe('categoria-nombre');
    escribir(f, 'categoria-nombre', ' CERTIFICACIONES '); escribir(f, 'categoria-descripcion', 'Descripción'); escribir(f, 'categoria-estrellas', '6');
    guardar(f);
    expect(f.nativeElement.querySelector('#categoria-error-nombre').textContent).toContain('Ya existe');
    expect(f.nativeElement.querySelector('#categoria-error-estrellas').textContent).toContain('entre 1 y 5');
    expect(f.componentInstance.formulario.controls.nombre.value).toBe(' CERTIFICACIONES ');
    expect(servicio.categorias()).toHaveLength(5);
  });

  it('carga edición, cancela sin cambios y permite desactivar y reactivar', () => {
    const { f, servicio } = preparar(), original = structuredClone(servicio.categorias()[0]);
    f.nativeElement.querySelector('.lista-categorias button').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('#categoria-formulario-titulo').textContent).toBe('Editar categoría');
    expect(f.nativeElement.querySelector('button[type="submit"]').textContent).toBe('Guardar cambios');
    escribir(f, 'categoria-nombre', 'Cambio sin guardar');
    f.nativeElement.querySelector('.acciones button[type="button"]').click(); f.detectChanges();
    expect(servicio.categorias()[0]).toEqual(original);
    expect(f.componentInstance.editandoId()).toBeNull();
    expect(f.componentInstance.formulario.controls.nombre.value).toBe('');
    for (const activa of [false, true]) {
      f.nativeElement.querySelector('.lista-categorias button').click(); f.detectChanges();
      const estado = f.nativeElement.querySelector('#categoria-activa') as HTMLSelectElement;
      estado.selectedIndex = activa ? 0 : 1; estado.dispatchEvent(new Event('change')); f.detectChanges(); guardar(f);
      expect(servicio.categorias()[0].activa).toBe(activa);
      expect(f.nativeElement.querySelector('.lista-categorias > li').textContent).toContain(activa ? 'Activa' : 'Inactiva');
      expect(servicio.categorias()).toHaveLength(5);
      expect(f.nativeElement.querySelector('[role="status"]').textContent).toContain('actualizada.');
    }
  });

  it('filtra por nombre y descripción mientras se escribe, sin distinguir mayúsculas o tildes', () => {
    const { f } = preparar();
    escribir(f, 'buscar-categorias', ' CERTIFICACIONES ');
    expect(f.nativeElement.querySelectorAll('.lista-categorias > li')).toHaveLength(1);
    expect(f.componentInstance.categoriasFiltradas()[0].id).toBe('certificaciones');
    escribir(f, 'buscar-categorias', 'RECONOCIMIENTOS EXTERNOS');
    expect(f.componentInstance.categoriasFiltradas().map(c => c.id)).toEqual(['clientes']);
    escribir(f, 'buscar-categorias', 'mentorias');
    expect(f.componentInstance.categoriasFiltradas().map(c => c.id)).toEqual(['mentorias']);
    expect(f.nativeElement.querySelector('#resultados-categorias').textContent).toContain('1 resultados de 5');
  });

  it('busca activas e inactivas, informa ausencia de coincidencias y limpia el filtro', () => {
    const { f, servicio } = preparar();
    const categoria = servicio.categorias()[0];
    servicio.guardar({ ...categoria, activa: false, icono: '' }, categoria.id); f.detectChanges();
    escribir(f, 'buscar-categorias', 'certificaciones');
    expect(f.nativeElement.querySelector('.lista-categorias').textContent).toContain('Inactiva');
    escribir(f, 'buscar-categorias', 'ninguna-coincidencia');
    expect(f.nativeElement.querySelectorAll('.lista-categorias button')).toHaveLength(0);
    expect(f.nativeElement.querySelector('.lista-categorias').textContent).toContain('No hay categorías que coincidan');
    expect(f.nativeElement.querySelector('#resultados-categorias').textContent).toContain('0 resultados de 5');
    f.nativeElement.querySelector('.busqueda-categorias button').click(); f.detectChanges();
    expect(f.componentInstance.consulta()).toBe('');
    expect(f.nativeElement.querySelectorAll('.lista-categorias button')).toHaveLength(5);
    expect(document.activeElement?.id).toBe('buscar-categorias');
  });

  it('conserva el borrador del formulario al escribir y limpiar búsquedas', () => {
    const { f } = preparar();
    escribir(f, 'categoria-nombre', 'Borrador sin guardar');
    escribir(f, 'categoria-descripcion', 'Descripción que debe permanecer');
    escribir(f, 'categoria-estrellas', '4');
    const anterior = f.componentInstance.formulario.getRawValue();
    escribir(f, 'buscar-categorias', 'clientes');
    expect(f.componentInstance.formulario.getRawValue()).toEqual(anterior);
    expect(f.nativeElement.querySelector('#categoria-nombre').value).toBe('Borrador sin guardar');
    f.nativeElement.querySelector('.busqueda-categorias button').click(); f.detectChanges();
    expect(f.componentInstance.formulario.getRawValue()).toEqual(anterior);
    expect(f.componentInstance.editandoId()).toBeNull();
  });

  it('edita un resultado filtrado, conserva filtro y posición de lista al guardar y al cancelar', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    try {
      const { f, servicio } = preparar();
      escribir(f, 'buscar-categorias', 'CERTIFICACIONES');
      await f.whenStable();
      const lista = f.nativeElement.querySelector('.lista-categorias') as HTMLElement;
      const formulario = f.nativeElement.querySelector('.formulario-panel') as HTMLElement;
      lista.scrollTop = 120; formulario.scrollTop = 80;
      const enfocar = vi.spyOn(f.nativeElement.querySelector('#categoria-nombre') as HTMLInputElement, 'focus');
      f.nativeElement.querySelector('.lista-categorias button').click(); f.detectChanges(); await f.whenStable();
      expect(f.componentInstance.editandoId()).toBe('certificaciones');
      expect(f.nativeElement.querySelector('.en-edicion')?.getAttribute('aria-current')).toBe('true');
      expect(enfocar).toHaveBeenCalledWith({ preventScroll: true });
      expect(formulario.scrollTop).toBe(0);
      expect(lista.scrollTop).toBe(120);
      escribir(f, 'categoria-nombre', 'Certificaciones actualizadas');
      guardar(f); await f.whenStable();
      expect(f.componentInstance.consulta()).toBe('CERTIFICACIONES');
      expect(f.nativeElement.querySelector('.lista-categorias')).toBe(lista);
      expect(lista.scrollTop).toBe(120);
      expect(lista.textContent).toContain('Certificaciones actualizadas');
      expect(servicio.categorias()).toHaveLength(5);
      f.nativeElement.querySelector('.lista-categorias button').click(); f.detectChanges();
      escribir(f, 'categoria-nombre', 'Cambio descartado');
      f.nativeElement.querySelector('.acciones button[type="button"]').click(); f.detectChanges(); await f.whenStable();
      expect(f.componentInstance.consulta()).toBe('CERTIFICACIONES');
      expect(f.componentInstance.editandoId()).toBeNull();
      expect(lista.textContent).toContain('Certificaciones actualizadas');
      expect(lista.scrollTop).toBe(120);
    } finally { vi.unstubAllGlobals(); }
  });

  it('mantiene título, buscador y resultados fuera del scroll y separa ambos paneles', () => {
    const { f } = preparar();
    const lista = f.nativeElement.querySelector('.lista-categorias') as HTMLElement;
    const formulario = f.nativeElement.querySelector('.formulario-panel') as HTMLElement;
    const cabecera = f.nativeElement.querySelector('.cabecera-disponibles') as HTMLElement;
    expect(lista.tabIndex).toBe(0);
    expect(lista.getAttribute('aria-labelledby')).toBe('categorias-disponibles-titulo');
    expect(lista.querySelector('#buscar-categorias')).toBeNull();
    expect(cabecera.querySelector('#buscar-categorias')).not.toBeNull();
    expect(cabecera.querySelector('#resultados-categorias')).not.toBeNull();
    expect(formulario.contains(lista)).toBe(false);
    expect(getComputedStyle(lista).overflowY).toBe('auto');
    expect(getComputedStyle(formulario).overflowY).toBe('auto');
    lista.scrollTop = 100;
    expect(formulario.scrollTop).toBe(0);
    formulario.scrollTop = 50;
    expect(lista.scrollTop).toBe(100);
    expect(f.nativeElement.querySelector('.acciones button[type="submit"]')).not.toBeNull();
  });

  it('centra las dos acciones con altura y separación comunes al crear y editar', () => {
    const { f } = preparar();
    const acciones = f.nativeElement.querySelector('.acciones') as HTMLElement;
    expect(getComputedStyle(acciones).justifyContent).toBe('center');
    expect(getComputedStyle(acciones).alignItems).toBe('stretch');
    expect(Number.parseFloat(getComputedStyle(acciones).gap)).toBeGreaterThan(0);
    const botones = Array.from(acciones.querySelectorAll('button'));
    expect(botones.map(b => b.textContent?.trim())).toEqual(['Cancelar', 'Crear categoría']);
    expect(botones.every(b => getComputedStyle(b).minHeight === '44px')).toBe(true);
    f.nativeElement.querySelector('.lista-categorias button').click(); f.detectChanges();
    expect(Array.from(acciones.querySelectorAll('button')).map(b => b.textContent?.trim())).toEqual(['Cancelar', 'Guardar cambios']);
    expect(getComputedStyle(acciones).justifyContent).toBe('center');
    expect(f.nativeElement.querySelector('.vista-previa')).toBeNull();
    expect(f.nativeElement.querySelector('#categoria-icono')).not.toBeNull();
  });
});
