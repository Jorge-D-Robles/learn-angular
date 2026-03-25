import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { CURRICULUM } from '../../core/curriculum/curriculum.data';
import type { ChapterId, PhaseNumber, StoryMission } from '../../core/curriculum/curriculum.types';
import { MissionCardComponent } from '../../shared/components';

interface MissionViewModel {
  mission: StoryMission;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}

interface PhaseGroupViewModel {
  phaseNumber: PhaseNumber;
  name: string;
  description: string;
  completedCount: number;
  totalCount: number;
  missions: MissionViewModel[];
}

@Component({
  selector: 'app-campaign',
  imports: [MissionCardComponent],
  templateUrl: './campaign.html',
  styleUrl: './campaign.scss',
})
export class CampaignPage {
  private readonly progression = inject(GameProgressionService);
  private readonly router = inject(Router);

  readonly overallCompleted = this.progression.completedMissionCount;

  readonly phaseGroups = computed<PhaseGroupViewModel[]>(() => {
    // Read the completedMissions signal at the top to establish reactivity
    this.progression.completedMissions();
    const current = this.progression.currentMission();

    return CURRICULUM.map((phase) => {
      const missions: MissionViewModel[] = phase.chapters.map((mission) => ({
        mission,
        isCompleted: this.progression.isMissionCompleted(mission.chapterId),
        isLocked: !this.progression.isMissionAvailable(mission.chapterId),
        isCurrent: current?.chapterId === mission.chapterId,
      }));

      const completedCount = missions.filter((m) => m.isCompleted).length;

      return {
        phaseNumber: phase.phaseNumber,
        name: phase.name,
        description: phase.description,
        completedCount,
        totalCount: phase.chapters.length,
        missions,
      };
    });
  });

  onMissionClicked(chapterId: ChapterId): void {
    this.router.navigate(['/mission', chapterId]);
  }
}
