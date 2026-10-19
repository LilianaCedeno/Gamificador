import { TestBed } from '@angular/core/testing';
import { Historial } from './historial';
import { crearEscenarioMock } from '../../../mocks/impulsa.mock';

describe('Historial', () => {
  function preparar(vacio = false) {
    const d = crearEscenarioMock();
    const f = TestBed.createComponent(Historial);
    f.componentRef.setInput('reconocimientos', vacio ? [] : d.reconocimientos);
    f.componentRef.setInput('personas', d.colaboradores);
    f.componentRef.setInput('categorias', d.categorias);
    f.componentRef.setInput('colaboradorId', 'col-1');
    f.detectChanges();
    return f;
  }
  it('filtra recibidos y enviados conservando trazabilidad', () => {
    const f = preparar();
    expect(f.nativeElement.querySelector('.historial').getAttribute('tabindex')).toBe('0');
    expect(f.nativeElement.querySelector('.historial').getAttribute('aria-label')).toContain('desplazamiento vertical');
    expect(f.nativeElement.querySelector('.historial .filtros')).toBeNull();
    expect(f.componentInstance.visibles()).toHaveLength(28);
    expect(f.nativeElement.textContent).toContain('Sara Prueba');
    expect(f.nativeElement.textContent).toContain('Cliente de ejemplo');
    expect(f.nativeElement.textContent).toContain('Rechazado');
    f.nativeElement.querySelectorAll('button')[1].click();
    f.detectChanges();
    expect(f.componentInstance.visibles()).toHaveLength(1);
    expect(f.nativeElement.textContent).toContain('Pendiente');
    expect(f.nativeElement.textContent).toContain('Luis Muestra');
    expect(f.nativeElement.querySelector('button[aria-pressed="true"]').textContent).toContain('Enviados');
  });
  it('muestra vacío y evita enlaces ficticios o inseguros', () => {
    const f = preparar(true);
    expect(f.nativeElement.textContent).toContain('No hay reconocimientos recibidos');
    expect(f.componentInstance.enlaceDisponible('javascript:alert(1)')).toBe(false);
    expect(f.componentInstance.enlaceDisponible('https://example.invalid/respaldo')).toBe(false);
    expect(f.componentInstance.enlaceDisponible('https://example.org/respaldo')).toBe(true);
  });
});
