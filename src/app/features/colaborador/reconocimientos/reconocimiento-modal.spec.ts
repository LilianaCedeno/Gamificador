import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { ReconocimientoModal } from './reconocimiento-modal';
import { ColaboradorDataService, type DashboardColaborador } from '../../../core/data-access/colaborador-data.service';
import { crearEscenarioMock } from '../../../mocks/impulsa.mock';

describe('ReconocimientoModal', () => {
  function preparar() {
    const escenario = crearEscenarioMock();
    const teclado = new Subject<KeyboardEvent>();
    const respuesta = new Subject<DashboardColaborador>();
    const cerrar = vi.fn();
    const reconocer = vi.fn().mockReturnValue(respuesta);
    TestBed.configureTestingModule({ providers: [
      { provide: DIALOG_DATA, useValue: { companeros: escenario.colaboradores.slice(1), categorias: escenario.categorias, tema: signal('oscuro') } },
      { provide: DialogRef, useValue: { close: cerrar, keydownEvents: teclado } },
      { provide: ColaboradorDataService, useValue: { reconocer } },
    ] });
    const f = TestBed.createComponent(ReconocimientoModal); f.detectChanges();
    return { f, cerrar, reconocer, respuesta, teclado };
  }
  it('impide cierre y doble envío mientras la solicitud está pendiente', () => {
    const { f, cerrar, reconocer, teclado } = preparar();
    const nuevo = { destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: 'Gracias', evidencias: [] };
    f.componentInstance.enviar(nuevo);
    f.componentInstance.enviar(nuevo);
    f.componentInstance.cerrar();
    teclado.next(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    f.detectChanges();
    expect(reconocer).toHaveBeenCalledTimes(1);
    expect(cerrar).not.toHaveBeenCalled();
    expect(f.nativeElement.querySelector('fieldset').disabled).toBe(true);
    expect(f.nativeElement.querySelector('[role="status"]').textContent).toContain('Espera para cerrar');
  });
  it('libera las acciones ante un error sin destruir el formulario', () => {
    const { f, respuesta, cerrar } = preparar();
    const formulario = f.nativeElement.querySelector('form');
    f.componentInstance.enviar({ destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: 'Gracias', evidencias: [] });
    respuesta.error(new Error()); f.detectChanges();
    expect(f.nativeElement.querySelector('form')).toBe(formulario);
    expect(f.nativeElement.querySelector('[role="alert"]').textContent).toContain('Tus datos se conservan');
    expect(f.componentInstance.enviando()).toBe(false);
    f.componentInstance.cerrar();
    expect(cerrar).toHaveBeenCalledTimes(1);
  });
});
