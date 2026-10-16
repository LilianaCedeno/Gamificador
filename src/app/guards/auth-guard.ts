import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthModalService } from '../auth/auth-modal.service';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const authModal = inject(AuthModalService);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) { return true; }

  authModal.solicitarLogin(state.url);

  return false;
};
