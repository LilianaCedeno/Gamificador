import { TestBed } from '@angular/core/testing';
import { ColaboradoresPanel } from './colaboradores-panel';
import { colaboradoresMock } from '../../../mocks/impulsa.mock';

describe('ColaboradoresPanel People', () => {
  function preparar() {
    const f = TestBed.createComponent(ColaboradoresPanel);
    f.componentRef.setInput('colaboradores', colaboradoresMock); f.detectChanges();
    return f;
  }
  it('busca por nombre e identificación sin distinguir mayúsculas ni tildes', () => {
    const f = preparar();
    f.componentRef.setInput('consulta', ' ÁNA  EJEMPLO '); f.detectChanges();
    expect(f.componentInstance.resultados().map(c => c.id)).toEqual(['col-1']);
    f.componentRef.setInput('consulta', 'demo-002'); f.detectChanges();
    expect(f.componentInstance.resultados().map(c => c.id)).toEqual(['col-2']);
    f.componentRef.setInput('consulta', 'no disponible'); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No hay colaboradores que coincidan');
  });
  it('emite búsqueda y selección única con controles nativos accesibles', () => {
    const f = preparar();
    f.componentRef.setInput('recientesIds', ['col-1']); f.detectChanges();
    const buscar = vi.spyOn(f.componentInstance.consultaCambio, 'emit');
    const seleccionar = vi.spyOn(f.componentInstance.seleccionar, 'emit');
    const input = f.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Ana'; input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(buscar).toHaveBeenCalledWith('Ana');
    f.nativeElement.querySelector('.resultado').click();
    expect(seleccionar).toHaveBeenCalledWith('col-1');
    f.componentRef.setInput('seleccionadoId', 'col-1'); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.resultado[aria-pressed="true"]')).toHaveLength(1);
    expect(f.nativeElement.querySelector('.resultado').textContent).not.toContain('Seleccionar');
    expect(f.nativeElement.querySelector('.resultado').textContent).toContain('DEMO-001');
    expect(getComputedStyle(f.nativeElement.querySelector('.resultado[aria-pressed="true"]')).borderLeftColor).not.toBe('transparent');
    f.componentRef.setInput('colaboradores', []); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No hay colaboradores disponibles');
  });

  it('muestra vacío sin consultas y busca sobre todo el catálogo aunque no esté en recientes', () => {
    const f = preparar();
    expect(f.nativeElement.querySelector('.resultado')).toBeNull();
    f.componentRef.setInput('recientesIds', ['col-1']); f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.resultado')).toHaveLength(1);
    f.componentRef.setInput('consulta', 'demo-003'); f.detectChanges();
    expect(f.nativeElement.querySelector('.resultado').textContent).toContain('Sara Prueba');
    expect(f.componentInstance.visibles().map(c => c.id)).toEqual(['people-1']);
  });

  it('presenta tres filas completas con altura natural y sin scroll de recientes', () => {
    const f = preparar();
    f.componentRef.setInput('recientesIds', ['col-2', 'col-1', 'people-1']); f.detectChanges();
    const lista = f.nativeElement.querySelector('.resultados') as HTMLElement;
    expect(getComputedStyle(lista).flexBasis).toBe('auto');
    expect(getComputedStyle(lista).flexShrink).toBe('0');
    expect(getComputedStyle(lista).overflowY).toBe('visible');
    expect(f.nativeElement.querySelector('input[type="search"]')).not.toBeNull();
    const filas = Array.from(lista.querySelectorAll<HTMLButtonElement>('.resultado'));
    expect(filas).toHaveLength(3);
    for (const [indice, id] of ['col-2', 'col-1', 'people-1'].entries()) {
      const persona = colaboradoresMock.find(p => p.id === id)!;
      expect(filas[indice].textContent).toContain(`${persona.nombre} ${persona.apellido}`);
      expect(filas[indice].textContent).toContain(persona.cargo);
      expect(filas[indice].textContent).toContain(persona.identificacionInterna);
      expect(filas[indice].querySelector('app-people-avatar')).not.toBeNull();
      expect(getComputedStyle(filas[indice].parentElement!).flexShrink).toBe('0');
    }
  });
});
