import { TestBed } from '@angular/core/testing';
import { ColaboradorRevision } from './colaborador-revision';
import { colaboradoresMock } from '../../../mocks/impulsa.mock';

describe('ColaboradorRevision People', () => {
  it('diferencia la persona revisada y emite limpieza sin modificar datos', () => {
    const f = TestBed.createComponent(ColaboradorRevision);
    f.componentRef.setInput('persona', colaboradoresMock[0]); f.detectChanges();
    const limpiar = vi.spyOn(f.componentInstance.limpiar, 'emit');
    expect(f.nativeElement.textContent).toContain('Colaborador en revisión');
    expect(f.nativeElement.textContent).toContain('DEMO-001');
    f.componentRef.setInput('persona', colaboradoresMock[1]); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Luis Muestra');
    expect(f.nativeElement.textContent).not.toContain('Ana Ejemplo');
    f.nativeElement.querySelector('button').click();
    expect(limpiar).toHaveBeenCalledTimes(1);
  });
});
