import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  imports: [],
  selector: 'app-about-modal',
  styleUrl: './about-modal.css',
  templateUrl: './about-modal.html',
})
export class AboutModal {

    private dialogRef = inject(DialogRef);
  
  cerrar(): void {
    this.dialogRef.close(false);
  }
}
