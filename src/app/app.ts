import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TemporalFooter } from './components/temporal/temporal.footer/temporal.footer';

@Component({
  imports: [RouterOutlet,TemporalFooter],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
