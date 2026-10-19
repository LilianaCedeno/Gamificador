import { Component } from '@angular/core';
import { Dashboard } from '../../features/colaborador/dashboard/dashboard';

@Component({
  imports: [Dashboard],
  selector: 'app-main-page',
  styleUrl: './main-page.css',
  templateUrl: './main-page.html',
})
export class MainPage {}
