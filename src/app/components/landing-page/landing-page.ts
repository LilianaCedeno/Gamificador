import { Component, inject } from '@angular/core';
import { AuthModalService } from '../../auth/auth-modal.service';
import { AboutModal } from '../../shared/about-modal/about-modal';
import { Dialog } from '@angular/cdk/dialog';

@Component({
  imports: [],
  selector: 'app-landing-page',
  styleUrl: './landing-page.css',
  templateUrl: './landing-page.html',
})
export class LandingPage {

  private authModal = inject(AuthModalService);
  private dialog = inject(Dialog);

  abrirLogin(): void {
    this.authModal.solicitarLogin('/main');
  }

  abrirAbout(): void {
    this.dialog.open(AboutModal, { width: '80vw', disableClose: false });
  }
}
