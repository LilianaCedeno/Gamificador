import { isDevMode } from '@angular/core';
import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

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
    expect(routes.map(r => r.path)).toEqual(['', 'home', 'main', 'wall', 'people', '**']);
    expect(routes.find(r => r.path === '')!.canActivate).toBeUndefined();
    expect(routes.find(r => r.path === 'home')!.canActivate).toBeUndefined();
    expect(routes.find(r => r.path === '**')!.redirectTo).toBe('');
  });

  it.each([true, false])('People permite acceso únicamente con desarrollo %s', async (desarrollo) => {
    vi.stubGlobal('ngDevMode', desarrollo);
    const { routes } = await import('./app.routes');
    const people = routes.find(r => r.path === 'people')!;
    expect(people.component).toBeUndefined();
    expect(people.loadComponent).toBeTypeOf('function');
    expect(people.canMatch).toHaveLength(1);
    const puedeAcceder = people.canMatch![0] as () => boolean;
    expect(puedeAcceder()).toBe(desarrollo);
    // No se exige sesión en desarrollo; producción queda excluida antes de cargar la vista.
    expect(people.canActivate).toBeUndefined();
  });

  it('carga diferida del componente People y renderizado exclusivamente cliente', async () => {
    const { routes } = await import('./app.routes');
    const { PeopleDashboard } = await import('./features/people/dashboard/people-dashboard');
    expect(await routes.find(r => r.path === 'people')!.loadComponent!()).toBe(PeopleDashboard);
    expect(serverRoutes.find(r => r.path === 'people')?.renderMode).toBe(RenderMode.Client);
  });
});
