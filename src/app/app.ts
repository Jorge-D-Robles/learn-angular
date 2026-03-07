import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './bottom-nav/bottom-nav';
import { SideNavComponent } from './side-nav/side-nav';
import { XpNotificationComponent } from './shared';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, BottomNavComponent, SideNavComponent, XpNotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
