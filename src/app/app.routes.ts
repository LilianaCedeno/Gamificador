import { Routes } from '@angular/router';
import { LandingPage } from './components/landing-page/landing-page';
import { MainPage } from './components/main-page/main-page';
import { WallPage } from './components/wall-page/wall-page';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
   {path:''       , component:LandingPage },
   {path:'home'   , component:LandingPage },
   {path:'main'   , component:MainPage , canActivate:[authGuard] },
   {path:'wall'   , component:WallPage , canActivate:[authGuard] },
   {path:'**'     , redirectTo:''   , pathMatch:'full'}
];
