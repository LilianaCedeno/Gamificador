import { TestBed } from '@angular/core/testing';
import { InsigniaCard } from './insignia-card';
import { crearEscenarioMock } from '../../../mocks/impulsa.mock';

describe('InsigniaCard', () => {
  it('muestra estrella vacía sin insignia y avance hacia Bronce', () => {
    const d = crearEscenarioMock();
    const f = TestBed.createComponent(InsigniaCard);
    f.componentRef.setInput('categoria', d.categorias[4]);
    f.componentRef.setInput('progreso', d.progresos[4]);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Sin insignia obtenida');
    expect(f.nativeElement.textContent).toContain('0 estrellas acumuladas');
    expect(f.nativeElement.querySelector('.medalla').textContent).toContain('☆');
    expect(f.nativeElement.querySelector('progress').max).toBe(5);
    expect(f.nativeElement.querySelector('img[medalla]')).toBeNull();
    expect(f.nativeElement.querySelectorAll('article > *')).toHaveLength(6);
    expect(f.nativeElement.querySelector('.meta-insignia progress')).not.toBeNull();
    expect(f.nativeElement.querySelector('.ascensos details')).toBeNull();
    expect(f.nativeElement.querySelector('.sin-ascensos')?.textContent).toContain('Aún no hay ascensos en esta categoría.');
  });

  it('muestra una sola insignia actual y detiene el avance en Platino', () => {
    const d = crearEscenarioMock();
    const f = TestBed.createComponent(InsigniaCard);
    f.componentRef.setInput('categoria', d.categorias[0]);
    f.componentRef.setInput('progreso', d.progresos[0]);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.medalla')).toHaveLength(1);
    expect(f.nativeElement.querySelector('.nivel').textContent).toContain('Platino');
    expect(f.nativeElement.textContent).toContain('25 estrellas acumuladas');
    expect(f.nativeElement.textContent).toContain('Nivel máximo alcanzado');
    expect(f.nativeElement.querySelector('progress')).toBeNull();
    expect(f.nativeElement.querySelectorAll('details li')).toHaveLength(4);
    const detalles = f.nativeElement.querySelector('details') as HTMLDetailsElement;
    expect(detalles.open).toBe(false);
    detalles.querySelector('summary')!.click();
    expect(detalles.open).toBe(true);
    expect(detalles.querySelectorAll('li')).toHaveLength(4);
    expect(f.nativeElement.querySelectorAll('article > *')).toHaveLength(6);
    expect(detalles.parentElement?.classList.contains('ascensos')).toBe(true);
  });

  it.each([
    [0, 'images/insignias/platino.png'],
    [1, 'images/insignias/oro.png'],
    [2, 'images/insignias/plata.png'],
    [3, 'images/insignias/bronce.png'],
  ])('muestra la imagen oficial correspondiente a la categoría %i', (indice, ruta) => {
    const d = crearEscenarioMock();
    const f = TestBed.createComponent(InsigniaCard);
    f.componentRef.setInput('categoria', d.categorias[indice]);
    f.componentRef.setInput('progreso', d.progresos[indice]);
    f.detectChanges();
    const imagen = f.nativeElement.querySelector('img[medalla]') as HTMLImageElement;
    expect(imagen.getAttribute('src')).toBe(ruta);
    expect(imagen.alt).toBe('');
    expect(f.nativeElement.querySelectorAll('img[medalla]')).toHaveLength(1);
    expect(f.nativeElement.querySelector('.medalla-placeholder')).toBeNull();
    expect(f.nativeElement.querySelector('.estrellas').textContent).toContain(`${d.progresos[indice].estrellas} estrellas acumuladas`);
  });

  it('con Oro conserva la medalla y muestra progreso hacia Platino', () => {
    const d = crearEscenarioMock();
    const f = TestBed.createComponent(InsigniaCard);
    f.componentRef.setInput('categoria', d.categorias[1]);
    f.componentRef.setInput('progreso', d.progresos[1]);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.nivel').textContent).toContain('Oro');
    expect(f.nativeElement.querySelector('progress').value).toBe(15);
    expect(f.nativeElement.querySelector('progress').max).toBe(25);
    expect(f.nativeElement.textContent).toContain('Faltan 10 estrellas');
    expect(f.nativeElement.textContent).not.toContain('Nivel máximo alcanzado');
  });
});
