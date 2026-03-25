import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { CurriculumService } from '../../core/curriculum/curriculum.service';
import { StoryMissionCompletionService, type MissionCompletionSummary } from '../../core/curriculum/story-mission-completion.service';
import type { ChapterId } from '../../core/curriculum/curriculum.types';
import { ALL_STORY_MISSIONS } from '../../core/curriculum/curriculum.data';
import { StoryMissionContentService } from '../../core/curriculum/story-mission-content.service';
import type { CodeExampleStep, ConceptStep } from '../../core/curriculum/story-mission-content.types';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { CodeEditorComponent, LockedContentComponent, StepProgressComponent } from '../../shared/components';
@Component({ selector: 'app-mission', imports: [CodeEditorComponent, LockedContentComponent, StepProgressComponent], templateUrl: './mission.html', styleUrl: './mission.scss' })
export class MissionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameProgression = inject(GameProgressionService);
  private readonly curriculum = inject(CurriculumService);
  private readonly missionCompletion = inject(StoryMissionCompletionService);
  private readonly missionContentService = inject(StoryMissionContentService);
  private readonly minigameRegistry = inject(MinigameRegistryService);
  readonly chapterId = toSignal(this.route.paramMap.pipe(map((p) => p.get('chapterId') ?? '')), { initialValue: '' });
  readonly chapterIdNum = computed(() => parseInt(this.chapterId(), 10) || 0);
  readonly missionContent = computed(() => this.missionContentService.getMissionContent(this.chapterIdNum()) ?? null);
  readonly missionMeta = computed(() => this.curriculum.getChapter(this.chapterIdNum() as ChapterId));
  readonly isAvailable = computed(() => this.gameProgression.isMissionAvailable(this.chapterIdNum() as ChapterId));
  readonly isCompleted = computed(() => this.gameProgression.isMissionCompleted(this.chapterIdNum() as ChapterId));
  readonly currentStep = signal(0);
  readonly stepsViewed = signal(1);
  readonly totalSteps = computed(() => this.missionContent()?.steps.length ?? 0);
  readonly completedStepIndices = computed(() => { const v = this.stepsViewed(); const c = this.currentStep() + 1; const r: number[] = []; for (let i = 1; i <= v; i++) { if (i !== c) r.push(i); } return r; });
  readonly currentStepData = computed(() => this.missionContent()?.steps[this.currentStep()] ?? null);
  readonly isFirstStep = computed(() => this.currentStep() === 0);
  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps() - 1);
  readonly canComplete = computed(() => this.isLastStep() && this.stepsViewed() >= (this.missionContent()?.completionCriteria.minStepsViewed ?? Infinity));
  readonly missionCompleted = signal(false);
  readonly completionResult = signal<MissionCompletionSummary | null>(null);
  readonly unlocksMinigame = computed(() => this.missionMeta()?.unlocksMinigame ?? null);
  readonly minigameName = computed(() => { const g = this.unlocksMinigame(); if (!g) return null; return this.minigameRegistry.getConfig(g as MinigameId)?.name ?? 'Minigame'; });
  readonly prerequisiteMessage = computed(() => { const deps = this.curriculum.getPrerequisites(this.chapterIdNum() as ChapterId); const cm = this.gameProgression.completedMissions(); const u = deps.find((d) => !cm.has(d)); if (u === undefined) return ''; const ch = this.curriculum.getChapter(u); return ch ? `Complete "${ch.title}" first` : `Complete chapter ${u} first`; });
  readonly collapsedConcept = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly codeExample = computed(() => { const s = this.currentStepData(); return s?.stepType === 'code-example' ? (s as CodeExampleStep) : null; });
  readonly codeBlocks = computed(() => { const e = this.codeExample(); return e?.codeBlocks?.length ? e.codeBlocks : null; });
  readonly concept = computed(() => { const s = this.currentStepData(); return s?.stepType === 'concept' ? (s as ConceptStep) : null; });
  readonly showCompletionSummary = computed(() => this.missionCompleted() && this.completionResult() !== null && !this.completionResult()!.alreadyCompleted);
  readonly nextChapterId = computed<ChapterId | null>(() => { const c = this.chapterIdNum(); const i = ALL_STORY_MISSIONS.findIndex((m) => m.chapterId === c); if (i < 0 || i >= ALL_STORY_MISSIONS.length - 1) return null; return ALL_STORY_MISSIONS[i + 1].chapterId; });
  readonly isLastInPhase = computed(() => { const m = this.missionMeta(); if (!m) return false; const p = this.curriculum.getPhaseForChapter(m.chapterId); return p.chapters[p.chapters.length - 1].chapterId === m.chapterId; });
  readonly continueLabel = computed(() => { if (this.nextChapterId() === null) return 'Back to Campaign'; if (this.isLastInPhase()) return 'Continue to Next Phase'; return 'Continue to Next Mission'; });
  nextStep(): void { if (!this.isLastStep()) { this.currentStep.update((s) => s + 1); this.stepsViewed.update((v) => Math.min(v + 1, this.totalSteps())); this.collapsedConcept.set(false); this.errorMessage.set(null); } }
  previousStep(): void { if (!this.isFirstStep()) { this.currentStep.update((s) => s - 1); this.collapsedConcept.set(false); this.errorMessage.set(null); } }
  completeMission(): void { try { const r = this.missionCompletion.completeMission(this.chapterIdNum() as ChapterId); this.completionResult.set(r ?? null); this.missionCompleted.set(true); } catch (e) { this.errorMessage.set(e instanceof Error ? e.message : 'Failed to complete mission'); } }
  launchMinigame(): void { const g = this.unlocksMinigame(); if (g) this.router.navigate(['/minigames', g]); }
  navigateToNext(): void { const n = this.nextChapterId(); if (n !== null) this.router.navigate(['/mission', n]); else this.router.navigate(['/campaign']); }
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void { if (this.showCompletionSummary()) return; const t = event.target as HTMLElement; const tn = t.tagName.toLowerCase(); if (tn === 'input' || tn === 'textarea' || t.isContentEditable) return; if (event.key === 'ArrowRight') { event.preventDefault(); this.nextStep(); } else if (event.key === 'ArrowLeft') { event.preventDefault(); this.previousStep(); } else if (event.key === 'Enter' && this.canComplete() && !this.missionCompleted() && !this.isCompleted()) { event.preventDefault(); this.completeMission(); } }
  toggleConceptPanel(): void { this.collapsedConcept.update((c) => !c); }
}
