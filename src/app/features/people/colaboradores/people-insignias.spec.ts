import { TestBed } from '@angular/core/testing';
import { PeopleInsignias } from './people-insignias';
import { crearEscenarioMock } from '../../../mocks/impulsa.mock';
import { calcularProgreso } from '../../../mocks/impulsa-calculos.mock';

describe('PeopleInsignias', () => {
  it('presenta cinco categorías, niveles, imágenes oficiales y ascensos sin acciones de escritura', () => {
    const d = crearEscenarioMock();
    const f = TestBed.createComponent(PeopleInsignias);
    f.componentRef.setInput('items', d.categorias.map(categoria => ({ categoria, progreso: calcularProgreso('col-1', categoria, d.reconocimientos) })));
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('article')).toHaveLength(5);
    for (const nivel of ['bronce', 'plata', 'oro', 'platino']) expect(f.nativeElement.querySelector(`img[src="images/insignias/${nivel}.png"]`)).not.toBeNull();
    expect(f.nativeElement.textContent).toContain('Sin insignia obtenida');
    expect(f.nativeElement.textContent).toContain('Nivel máximo alcanzado');
    expect(f.nativeElement.querySelectorAll('details')).toHaveLength(4);
    expect(f.nativeElement.querySelector('button')).toBeNull();
    f.componentRef.setInput('resumen', true); f.detectChanges();
    expect(f.nativeElement.querySelector('details')).toBeNull();
    expect(f.nativeElement.querySelectorAll('article')).toHaveLength(5);
  });
});
