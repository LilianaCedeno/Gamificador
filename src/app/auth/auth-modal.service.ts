// src/app/auth/auth-modal.service.ts
import { Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { LoginModal } from './login-modal/login-modal';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private dialog = inject(Dialog);
  private router = inject(Router);

  /**
   * Abre el flujo de autenticación.
   * @param returnUrl Ruta a la que navegar tras un login exitoso (opcional)
   */
  solicitarLogin(returnUrl?: string): void {
    const ref = this.dialog.open<boolean>(LoginModal, {
      width: '420px',
      disableClose: false,
      data: { returnUrl } // el modal puede mostrar un mensaje contextual
    });

    ref.closed.subscribe((loginExitoso) => {
      if (loginExitoso && returnUrl) {
        this.router.navigateByUrl(returnUrl);
      } else if (loginExitoso) {
        this.router.navigateByUrl('/dashboard');
      }
    });
  }
}