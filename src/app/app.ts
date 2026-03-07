import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './bottom-nav/bottom-nav';
import { XpService } from './core/progression/xp.service';
import { SideNavComponent } from './side-nav/side-nav';
import { XpNotificationComponent, XpProgressBarComponent } from './shared';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, BottomNavComponent, SideNavComponent, XpNotificationComponent, XpProgressBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly xpService = inject(XpService);

  readonly currentRank = this.xpService.currentRank;
  readonly rankProgress = this.xpService.rankProgress;
}
