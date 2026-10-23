import { TestBed } from '@angular/core/testing';
import { SeccionFutura } from './seccion-futura';
import { colaboradoresMock } from '../../../mocks/impulsa.mock';

describe('SeccionFutura People', () => {
  it('informa disponibilidad futura sin aparentar operaciones y sustituye contexto', () => {
    const f = TestBed.createComponent(SeccionFutura);
    f.componentRef.setInput('titulo', 'Reconocimientos');
    f.componentRef.setInput('descripcion', 'Próxima consulta');
    f.componentRef.setInput('persona', colaboradoresMock[0]); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Disponible en próximas historias de usuario');
    expect(f.nativeElement.querySelector('button')).toBeNull();
    f.componentRef.setInput('persona', colaboradoresMock[1]); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Luis Muestra');
    expect(f.nativeElement.textContent).not.toContain('Ana Ejemplo');
    f.componentRef.setInput('persona', null); f.detectChanges();
    expect(f.nativeElement.querySelector('.contexto')).toBeNull();
  });
});
