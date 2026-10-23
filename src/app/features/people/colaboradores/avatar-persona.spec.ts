import { TestBed } from '@angular/core/testing';
import { AvatarPersona } from './avatar-persona';
import { colaboradoresMock } from '../../../mocks/impulsa.mock';

describe('AvatarPersona People', () => {
  it('muestra iniciales sin solicitar fotografías ficticias y cambia de persona', () => {
    const f = TestBed.createComponent(AvatarPersona);
    f.componentRef.setInput('persona', colaboradoresMock[0]); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('AE');
    expect(f.nativeElement.querySelector('img')).toBeNull();
    f.componentRef.setInput('persona', colaboradoresMock[1]); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('LM');
    expect(f.nativeElement.querySelector('[role="img"]').getAttribute('aria-label')).toContain('Luis Muestra');
  });
  it('usa foto disponible y recupera iniciales si falla sin contaminar otro perfil', () => {
    const f = TestBed.createComponent(AvatarPersona);
    f.componentRef.setInput('persona', { ...colaboradoresMock[0], fotografiaUrl: '/foto-ana.jpg' }); f.detectChanges();
    f.nativeElement.querySelector('img').dispatchEvent(new Event('error')); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('AE');
    f.componentRef.setInput('persona', { ...colaboradoresMock[1], fotografiaUrl: '/foto-luis.jpg' }); f.detectChanges();
    expect(f.nativeElement.querySelector('img').getAttribute('src')).toBe('/foto-luis.jpg');
  });
});
