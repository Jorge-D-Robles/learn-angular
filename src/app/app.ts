import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SideNavComponent } from './side-nav/side-nav';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, SideNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
