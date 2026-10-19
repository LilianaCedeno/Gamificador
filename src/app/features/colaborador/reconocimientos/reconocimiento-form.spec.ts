import { TestBed } from '@angular/core/testing';
import { ReconocimientoForm } from './reconocimiento-form';
import { crearEscenarioMock } from '../../../mocks/impulsa.mock';

describe('ReconocimientoForm', () => {
  function preparar() {
    const f = TestBed.createComponent(ReconocimientoForm);
    const d = crearEscenarioMock();
    f.componentRef.setInput('companeros', d.colaboradores.filter(c => c.id !== 'col-1'));
    f.componentRef.setInput('categorias', d.categorias);
    f.detectChanges();
    return f;
  }
  it('valida campos, espacios, autorreconocimiento y enlaces inseguros', () => {
    const f = preparar();
    const emitir = vi.spyOn(f.componentInstance.enviar, 'emit');
    f.componentInstance.submit();
    expect(f.componentInstance.error).toBeTruthy();
    const form = f.componentInstance.formulario;
    form.patchValue({ destinatarioId: 'col-1', categoriaId: 'mentorias', motivo: 'Gracias' });
    f.componentInstance.submit();
    expect(emitir).not.toHaveBeenCalled();
    form.patchValue({ destinatarioId: 'col-2', motivo: '   ' });
    f.componentInstance.submit();
    expect(emitir).not.toHaveBeenCalled();
    form.patchValue({ motivo: 'Gracias', enlace: 'javascript:alert(1)' });
    f.componentInstance.submit();
    expect(f.componentInstance.error).toContain('HTTP o HTTPS');
    expect(emitir).not.toHaveBeenCalled();
  });
  it('emite un reconocimiento con enlace y previene duplicados mientras envía', () => {
    const f = preparar();
    const emitir = vi.spyOn(f.componentInstance.enviar, 'emit');
    f.componentInstance.formulario.patchValue({ destinatarioId: 'col-2', categoriaId: 'mentorias', motivo: ' Gracias ', enlace: 'https://example.org/respaldo' });
    f.componentInstance.submit();
    expect(emitir).toHaveBeenCalledWith(expect.objectContaining({ motivo: 'Gracias', evidencias: [expect.objectContaining({ tipo: 'ENLACE' })] }));
    f.componentRef.setInput('enviando', true);
    f.componentInstance.submit();
    expect(emitir).toHaveBeenCalledTimes(1);
  });
  it('acepta PDF/JPG como metadatos y rechaza otros archivos', () => {
    const f = preparar();
    const input = f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: [new File(['demo'], 'respaldo.pdf', { type: 'application/pdf' })] });
    input.dispatchEvent(new Event('change'));
    expect(f.componentInstance.archivo?.name).toBe('respaldo.pdf');
    Object.defineProperty(input, 'files', { configurable: true, value: [new File(['demo'], 'respaldo.jpg', { type: 'image/jpeg' })] });
    input.dispatchEvent(new Event('change'));
    expect(f.componentInstance.archivo?.name).toBe('respaldo.jpg');
    Object.defineProperty(input, 'files', { configurable: true, value: [new File(['demo'], 'respaldo.exe', { type: 'application/octet-stream' })] });
    input.dispatchEvent(new Event('change'));
    expect(f.componentInstance.archivo).toBeNull();
    expect(f.componentInstance.error).toContain('PDF o JPG');
  });
});
