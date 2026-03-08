import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './bottom-nav/bottom-nav';
import { StreakService, XpService, RankUpNotificationService, getCurrentRankThreshold, getNextRankThreshold } from './core';
import { SideNavComponent } from './side-nav/side-nav';
import { RankUpOverlayComponent, StreakBadgeComponent, XpNotificationComponent, XpProgressBarComponent } from './shared';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, BottomNavComponent, SideNavComponent, StreakBadgeComponent, XpNotificationComponent, XpProgressBarComponent, RankUpOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly streakService = inject(StreakService);
  private readonly xpService = inject(XpService);
  protected readonly rankUpService = inject(RankUpNotificationService);

  readonly activeStreakDays = this.streakService.activeStreakDays;
  readonly streakMultiplier = this.streakService.streakMultiplier;
  readonly currentRank = this.xpService.currentRank;

  readonly rankXpProgress = computed(() => {
    const totalXp = this.xpService.totalXp();
    return totalXp - getCurrentRankThreshold(totalXp).xpRequired;
  });

  readonly rankXpRange = computed(() => {
    const totalXp = this.xpService.totalXp();
    const next = getNextRankThreshold(totalXp);
    if (!next) return 0;
    return next.xpRequired - getCurrentRankThreshold(totalXp).xpRequired;
  });
}
