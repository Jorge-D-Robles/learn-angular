import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { CurriculumService } from '../../core/curriculum/curriculum.service';
import { StoryMissionCompletionService, type MissionCompletionSummary } from '../../core/curriculum/story-mission-completion.service';
import type { ChapterId } from '../../core/curriculum/curriculum.types';
import { StoryMissionContentService } from '../../core/curriculum/story-mission-content.service';
import type { CodeChallengeStep, CodeExampleStep, ConceptStep } from '../../core/curriculum/story-mission-content.types';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { CodeChallengeComponent, CodeEditorComponent, LockedContentComponent, StepProgressComponent } from '../../shared/components';

@Component({
  selector: 'app-mission',
  imports: [CodeChallengeComponent, CodeEditorComponent, LockedContentComponent, StepProgressComponent],
  templateUrl: './mission.html',
  styleUrl: './mission.scss',
})
export class MissionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameProgression = inject(GameProgressionService);
  private readonly curriculum = inject(CurriculumService);
  private readonly missionCompletion = inject(StoryMissionCompletionService);
  private readonly missionContentService = inject(StoryMissionContentService);
  private readonly minigameRegistry = inject(MinigameRegistryService);

  readonly chapterId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('chapterId') ?? '')),
    { initialValue: '' },
  );

  readonly chapterIdNum = computed(() => parseInt(this.chapterId(), 10) || 0);

  readonly missionContent = computed(
    () => this.missionContentService.getMissionContent(this.chapterIdNum()) ?? null,
  );

  readonly missionMeta = computed(
    () => this.curriculum.getChapter(this.chapterIdNum() as ChapterId),
  );

  readonly isAvailable = computed(
    () => this.gameProgression.isMissionAvailable(this.chapterIdNum() as ChapterId),
  );

  readonly isCompleted = computed(
    () => this.gameProgression.isMissionCompleted(this.chapterIdNum() as ChapterId),
  );

  readonly currentStep = signal(0);
  readonly stepsViewed = signal(1);

  readonly totalSteps = computed(() => this.missionContent()?.steps.length ?? 0);

  readonly completedStepIndices = computed(() => {
    const viewed = this.stepsViewed();
    const current1Based = this.currentStep() + 1;
    const result: number[] = [];
    for (let i = 1; i <= viewed; i++) {
      if (i !== current1Based) {
        result.push(i);
      }
    }
    return result;
  });

  readonly currentStepData = computed(
    () => this.missionContent()?.steps[this.currentStep()] ?? null,
  );

  readonly isFirstStep = computed(() => this.currentStep() === 0);
  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps() - 1);

  readonly canComplete = computed(
    () =>
      this.isLastStep() &&
      this.stepsViewed() >= (this.missionContent()?.completionCriteria.minStepsViewed ?? Infinity) &&
      this.allChallengesSolved(),
  );

  readonly missionCompleted = signal(false);
  readonly completionResult = signal<MissionCompletionSummary | null>(null);

  readonly unlocksMinigame = computed(
    () => this.missionMeta()?.unlocksMinigame ?? null,
  );

  /** Human-readable minigame name from the registry; null when chapter has no minigame. */
  readonly minigameName = computed(() => {
    const gameId = this.unlocksMinigame();
    if (!gameId) return null;
    return this.minigameRegistry.getConfig(gameId as MinigameId)?.name ?? 'Minigame';
  });

  readonly prerequisiteMessage = computed(() => {
    const deps = this.curriculum.getPrerequisites(this.chapterIdNum() as ChapterId);
    const completedMissions = this.gameProgression.completedMissions();
    const unmet = deps.find((depId) => !completedMissions.has(depId));
    if (unmet === undefined) return '';
    const chapter = this.curriculum.getChapter(unmet);
    return chapter ? `Complete "${chapter.title}" first` : `Complete chapter ${unmet} first`;
  });

  readonly collapsedConcept = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly codeExample = computed(() => {
    const step = this.currentStepData();
    return step?.stepType === 'code-example' ? (step as CodeExampleStep) : null;
  });

  readonly codeBlocks = computed(() => {
    const ex = this.codeExample();
    return ex?.codeBlocks?.length ? ex.codeBlocks : null;
  });

  readonly concept = computed(() => {
    const step = this.currentStepData();
    return step?.stepType === 'concept' ? (step as ConceptStep) : null;
  });

  readonly codeChallenge = computed(() => {
    const step = this.currentStepData();
    return step?.stepType === 'code-challenge' ? (step as CodeChallengeStep) : null;
  });

  readonly solvedChallenges = signal<ReadonlySet<number>>(new Set());

  readonly allChallengesSolved = computed(() => {
    const content = this.missionContent();
    if (!content) return true;
    const solved = this.solvedChallenges();
    return content.steps.every(
      (step, i) => step.stepType !== 'code-challenge' || solved.has(i),
    );
  });

  nextStep(): void {
    if (!this.isLastStep()) {
      this.currentStep.update((s) => s + 1);
      this.stepsViewed.update((v) => Math.min(v + 1, this.totalSteps()));
      this.collapsedConcept.set(false);
      this.errorMessage.set(null);
    }
  }

  previousStep(): void {
    if (!this.isFirstStep()) {
      this.currentStep.update((s) => s - 1);
      this.collapsedConcept.set(false);
      this.errorMessage.set(null);
    }
  }

  completeMission(): void {
    try {
      const result = this.missionCompletion.completeMission(this.chapterIdNum() as ChapterId);
      this.completionResult.set(result ?? null);
      this.missionCompleted.set(true);
    } catch (e) {
      this.errorMessage.set(e instanceof Error ? e.message : 'Failed to complete mission');
    }
  }

  launchMinigame(): void {
    const gameId = this.unlocksMinigame();
    if (gameId) {
      this.router.navigate(['/minigames', gameId]);
    }
  }

  toggleConceptPanel(): void {
    this.collapsedConcept.update((c) => !c);
  }

  onChallengeCompleted(): void {
    const idx = this.currentStep();
    this.solvedChallenges.update((s) => {
      const next = new Set(s);
      next.add(idx);
      return next;
    });
  }
}
