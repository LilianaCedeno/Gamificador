import { isDevMode } from '@angular/core';

describe('Acceso temporal al Dashboard IMPULSA', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it.each([true, false])('con modo desarrollo %s aplica la protección correspondiente', async (desarrollo) => {
    // Angular consulta ngDevMode; el build optimizado de producción lo fija en false.
    vi.stubGlobal('ngDevMode', desarrollo);
    vi.resetModules();
    expect(isDevMode()).toBe(desarrollo);
    const { routes } = await import('./app.routes');
    const { authGuard } = await import('./guards/auth-guard');
    const main = routes.find(r => r.path === 'main')!;
    expect(main.canActivate).toEqual(desarrollo ? [] : [authGuard]);
    expect(routes.find(r => r.path === 'wall')!.canActivate).toEqual([authGuard]);
    expect(routes.map(r => r.path)).toEqual(['', 'home', 'main', 'wall', '**']);
    expect(routes.find(r => r.path === '')!.canActivate).toBeUndefined();
    expect(routes.find(r => r.path === 'home')!.canActivate).toBeUndefined();
    expect(routes.find(r => r.path === '**')!.redirectTo).toBe('');
  });
});
