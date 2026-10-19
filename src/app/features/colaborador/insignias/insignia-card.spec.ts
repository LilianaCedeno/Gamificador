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
  });

  it('muestra una sola insignia actual y detiene el avance en Oro', () => {
    const d = crearEscenarioMock();
    const f = TestBed.createComponent(InsigniaCard);
    f.componentRef.setInput('categoria', d.categorias[0]);
    f.componentRef.setInput('progreso', d.progresos[0]);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.medalla')).toHaveLength(1);
    expect(f.nativeElement.querySelector('.nivel').textContent).toContain('Oro');
    expect(f.nativeElement.textContent).toContain('12 estrellas acumuladas');
    expect(f.nativeElement.textContent).toContain('Nivel máximo alcanzado');
    expect(f.nativeElement.querySelector('progress')).toBeNull();
    expect(f.nativeElement.querySelectorAll('details li')).toHaveLength(3);
  });
});
