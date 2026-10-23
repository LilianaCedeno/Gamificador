import { TestBed } from '@angular/core/testing';
import { ReconocimientoDetalle } from './reconocimiento-detalle';
import { crearEscenarioMock } from '../../../mocks/impulsa.mock';
import { PeopleConsulta } from './people-consulta';
import { calcularIndicadoresPeople } from '../../../core/data-access/people-data.service';

describe('Detalle de reconocimiento People', () => {
  const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
  const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.setAttribute('open', ''); }) });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: vi.fn(function(this: HTMLDialogElement) { this.removeAttribute('open'); }) });
  });
  afterEach(() => {
    if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal); else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close); else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  });
  it('muestra pendiente, evidencia y acciones deshabilitadas sin aplicar decisiones', async () => {
    const d = crearEscenarioMock(), copia = structuredClone(d);
    const f = TestBed.createComponent(ReconocimientoDetalle);
    f.componentRef.setInput('reconocimiento', d.reconocimientos.find(r => r.estado === 'PENDIENTE'));
    f.componentRef.setInput('personas', d.colaboradores); f.componentRef.setInput('categorias', d.categorias); f.detectChanges(); await f.whenStable();
    expect(f.nativeElement.querySelector('dialog').open).toBe(true);
    expect(f.nativeElement.textContent).toContain('Luis Muestra');
    expect(f.nativeElement.textContent).toContain('Ana Ejemplo');
    expect(f.nativeElement.textContent).toContain('archivo no disponible');
    const acciones = f.nativeElement.querySelectorAll('.acciones button') as NodeListOf<HTMLButtonElement>;
    expect(acciones).toHaveLength(2);
    for (const accion of acciones) { expect(accion.disabled).toBe(true); accion.click(); }
    expect(f.nativeElement.querySelector('textarea').required).toBe(true);
    expect(f.nativeElement.querySelector('textarea').disabled).toBe(true);
    expect(d).toEqual(copia);
    const cerrar = vi.spyOn(f.componentInstance.cerrar, 'emit');
    f.nativeElement.querySelector('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(cerrar).toHaveBeenCalledOnce();
    expect(f.nativeElement.querySelector('dialog').open).toBe(false);
  });

  it('abre el modal al seleccionar un reconocimiento de la consulta y lo cierra sin mutaciones', async () => {
    const d = crearEscenarioMock(), copia = structuredClone(d);
    const f = TestBed.createComponent(PeopleConsulta);
    f.componentRef.setInput('datos', { ...d, mes: '2026-10', indicadores: calcularIndicadoresPeople(d.reconocimientos, '2026-10') });
    f.componentRef.setInput('mesInicial', '2026-10'); f.detectChanges();
    f.componentInstance.actualizar('estado', 'PENDIENTE'); f.detectChanges();
    f.nativeElement.querySelector('.registros button').click(); f.detectChanges(); await f.whenStable();
    expect(f.nativeElement.querySelector('dialog').open).toBe(true);
    expect(f.nativeElement.querySelector('dialog').textContent).toContain('Revisar reconocimiento pendiente');
    f.nativeElement.querySelector('dialog header button').click(); f.detectChanges();
    expect(f.nativeElement.querySelector('dialog')).toBeNull();
    expect(d).toEqual(copia);
  });
});
