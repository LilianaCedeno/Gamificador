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
   {path:'**'     , redirectTo:''   , pathMatch:'full'}
];
