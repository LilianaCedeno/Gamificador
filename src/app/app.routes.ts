import { Routes } from '@angular/router';
import { isDevMode } from '@angular/core';
import { LandingPage } from './components/landing-page/landing-page';
import { MainPage } from './components/main-page/main-page';
import { WallPage } from './components/wall-page/wall-page';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
   {path:''       , component:LandingPage },
   {path:'home'   , component:LandingPage },
   // TEMPORAL — SOLO DESARROLLO: permite probar el dashboard mock sin login.
   // En producción se conserva authGuard. Retirar esta excepción al integrar roles.
   {path:'main'   , component:MainPage , canActivate: isDevMode() ? [] : [authGuard] },
   {path:'wall'   , component:WallPage , canActivate:[authGuard] },
   // TEMPORAL — SOLO DESARROLLO: People con datos e identidad de demostración.
   // Bloqueado en producción hasta integrar autorización real del rol PEOPLE.
   {
      path: 'people',
      canMatch: [() => isDevMode()],
      loadComponent: () => import('./features/people/dashboard/people-dashboard')
         .then(m => m.PeopleDashboard)
   },
   {path:'**'     , redirectTo:''   , pathMatch:'full'}
];
