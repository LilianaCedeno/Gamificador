import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-login-modal',
  styleUrl: './login-modal.css',
  templateUrl: './login-modal.html',
})
export class LoginModal {

  private dialogRef = inject(DialogRef);
  public data = inject(DIALOG_DATA) as { returnUrl?: string };

  // Aquí se inyectará el AuthService real cuando exista conexión al backend
  // private authService = inject(AuthService);

  onSubmit(credenciales: { email: string; password: string }): void {
    
    // SIMULACIÓN: reemplazar con la llamada real al backend
    // this.authService.login(credenciales).subscribe({
    //   next: () => this.dialogRef.close(true),
    //   error: () => { /* mostrar error */ }
    // });

    // Simulación exitosa
    this.dialogRef.close(true);
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
