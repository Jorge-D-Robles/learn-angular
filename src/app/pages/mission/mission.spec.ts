import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { MissionPage } from './mission';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { CurriculumService } from '../../core/curriculum/curriculum.service';
import { StoryMissionCompletionService } from '../../core/curriculum/story-mission-completion.service';
import type { ChapterId, StoryMission } from '../../core/curriculum/curriculum.types';
import { CHAPTER_01_CONTENT } from '../../data/missions/phase-1';
import { APP_ICONS } from '../../shared/icons';

const ICON_PROVIDERS = [
  {
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider(APP_ICONS),
  },
  {
    provide: LucideIconConfig,
    useValue: Object.assign(new LucideIconConfig(), {
      size: 24,
      color: 'currentColor',
    }),
  },
];

// Chapter 1 has 4 steps: narrative, code-example, concept, code-example
// completionCriteria.minStepsViewed = 4

const TEST_CHAPTER_META: StoryMission = {
  chapterId: 1,
  title: 'Build the Emergency Shelter',
  angularTopic: 'Components',
  narrative: 'Create your first station module from scratch',
  unlocksMinigame: 'module-assembly',
  deps: [],
  phase: 1,
};

const TEST_CHAPTER_META_NO_MINIGAME: StoryMission = {
  chapterId: 9,
  title: 'Progressive Module Loading',
  angularTopic: 'Deferrable Views',
  narrative: 'Load heavy modules on demand to save power',
  unlocksMinigame: null,
  deps: [8],
  phase: 1,
};

interface SetupOptions {
  chapterId?: string;
  isAvailable?: boolean;
  isCompleted?: boolean;
  completedMissions?: ReadonlySet<ChapterId>;
  chapterMeta?: StoryMission | undefined;
  prerequisites?: ChapterId[];
  completeMissionFn?: (...args: unknown[]) => void;
}

async function setup(options: SetupOptions = {}) {
  const {
    chapterId = '1',
    isAvailable = true,
    isCompleted = false,
    completedMissions = new Set<ChapterId>(),
    chapterMeta = TEST_CHAPTER_META,
    prerequisites = [],
    completeMissionFn = vi.fn(),
  } = options;

  const paramMapSubject = new BehaviorSubject(convertToParamMap({ chapterId }));
  const navigateFn = vi.fn();

  const completedMissionsSignal: WritableSignal<ReadonlySet<ChapterId>> = signal(completedMissions);

  const result = await createComponent(MissionPage, {
    providers: [
      ...ICON_PROVIDERS,
      {
        provide: ActivatedRoute,
        useValue: { paramMap: paramMapSubject.asObservable() },
      },
      getMockProvider(GameProgressionService, {
        isMissionAvailable: () => isAvailable,
        isMissionCompleted: () => isCompleted,
        completedMissions: completedMissionsSignal,
      }),
      getMockProvider(StoryMissionCompletionService, {
        completeMission: completeMissionFn,
      }),
      getMockProvider(CurriculumService, {
        getChapter: (id: ChapterId) => {
          if (id === chapterMeta?.chapterId) return chapterMeta;
          // For prerequisite lookups
          if (id === 1) return TEST_CHAPTER_META;
          return undefined;
        },
        getPrerequisites: () => prerequisites,
      }),
      getMockProvider(Router, {
        navigate: navigateFn,
      }),
    ],
  });

  return { ...result, navigateFn, paramMapSubject, completeMissionFn, completedMissionsSignal };
}

describe('MissionPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // === Content rendering (3 tests) ===

  it('should render mission title from CurriculumService metadata', async () => {
    const { element } = await setup();
    const title = element.querySelector('.mission__title');
    expect(title?.textContent).toContain('Build the Emergency Shelter');
  });

  it('should render narrative text for the current step', async () => {
    const { element } = await setup();
    const narrative = element.querySelector('.mission__narrative');
    expect(narrative?.textContent).toContain(CHAPTER_01_CONTENT.steps[0].narrativeText);
  });

  it('should render progress indicator showing "Step 1 of 4"', async () => {
    const { element } = await setup();
    const progress = element.querySelector('.mission__progress');
    expect(progress?.textContent?.trim()).toBe('Step 1 of 4');
    expect(progress?.getAttribute('role')).toBe('progressbar');
    expect(progress?.getAttribute('aria-valuemin')).toBe('1');
  });

  // === Step navigation (6 tests) ===

  it('should start at step 0 (first step)', async () => {
    const { component } = await setup();
    expect(component.currentStep()).toBe(0);
  });

  it('should advance to next step when Next is clicked', async () => {
    const { element, fixture, component } = await setup();
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const next = buttons.find((b) => b.textContent?.trim() === 'Next') as HTMLButtonElement;
    expect(next).toBeTruthy();
    next.click();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(1);
  });

  it('should go back when Previous is clicked', async () => {
    const { element, fixture, component } = await setup();
    // Navigate to step 1 first
    component.nextStep();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(1);

    const buttons = Array.from(element.querySelectorAll('footer button'));
    const prev = buttons.find((b) => b.textContent?.trim() === 'Previous') as HTMLButtonElement;
    expect(prev).toBeTruthy();
    prev.click();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(0);
  });

  it('should disable Previous button on first step', async () => {
    const { element } = await setup();
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const prev = buttons.find((b) => b.textContent?.trim() === 'Previous') as HTMLButtonElement;
    expect(prev).toBeTruthy();
    expect(prev.disabled).toBe(true);
  });

  it('should show Complete Mission button on last step when stepsViewed meets criteria', async () => {
    const { element, fixture, component } = await setup();
    // Navigate through all 4 steps (step 0 -> 1 -> 2 -> 3)
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(3);
    expect(component.isLastStep()).toBe(true);
    expect(component.stepsViewed()).toBe(4);

    const buttons = Array.from(element.querySelectorAll('footer button'));
    const complete = buttons.find(
      (b) => b.textContent?.trim() === 'Complete Mission',
    ) as HTMLButtonElement;
    expect(complete).toBeTruthy();
  });

  it('should reset collapsedConcept to false when navigating to a new step', async () => {
    const { component } = await setup();
    // Navigate to concept step (step 2)
    component.nextStep();
    component.nextStep();
    // Collapse the concept panel
    component.collapsedConcept.set(true);
    expect(component.collapsedConcept()).toBe(true);
    // Navigate forward
    component.nextStep();
    expect(component.collapsedConcept()).toBe(false);
  });

  // === Code example steps (3 tests) ===

  it('should render CodeEditorComponent for code-example steps', async () => {
    const { element, fixture, component } = await setup();
    // Step 1 is a code-example step
    component.nextStep();
    fixture.detectChanges();
    const codeEditor = element.querySelector('nx-code-editor');
    expect(codeEditor).toBeTruthy();
  });

  it('should pass readOnly=true to CodeEditorComponent', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    fixture.detectChanges();
    const codeEditor = element.querySelector('nx-code-editor');
    expect(codeEditor).toBeTruthy();
    // Verify no textarea is rendered (readOnly mode hides it)
    const textarea = codeEditor?.querySelector('textarea');
    expect(textarea).toBeFalsy();
  });

  it('should render explanation text for code-example steps', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    fixture.detectChanges();
    const explanation = element.querySelector('.mission__explanation');
    expect(explanation).toBeTruthy();
    expect(explanation?.textContent).toContain('The @Component decorator marks');
  });

  // === Concept steps (4 tests) ===

  it('should render concept panel with title for concept steps', async () => {
    const { element, fixture, component } = await setup();
    // Step 2 is concept
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    const toggle = element.querySelector('.mission__concept-toggle');
    expect(toggle).toBeTruthy();
    expect(toggle?.textContent?.trim()).toBe('What is a Component?');
  });

  it('should show concept body when panel is expanded (default)', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    const body = element.querySelector('.mission__concept-body');
    expect(body).toBeTruthy();
    expect(body?.textContent).toContain('fundamental building blocks');
  });

  it('should hide concept body when panel is collapsed', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    // Click the toggle to collapse
    const toggle = element.querySelector('.mission__concept-toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    const body = element.querySelector('.mission__concept-body');
    expect(body).toBeFalsy();
  });

  it('should render key points list when present', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    const keyPoints = element.querySelectorAll('.mission__key-points li');
    expect(keyPoints.length).toBe(3);
    expect(keyPoints[0].textContent).toContain('standalone by default');
  });

  // === Completion state (5 tests) ===

  it('should call StoryMissionCompletionService.completeMission on Complete button click', async () => {
    const completeMissionFn = vi.fn();
    const { element, fixture, component } = await setup({ completeMissionFn });
    // Navigate to last step
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const complete = buttons.find(
      (b) => b.textContent?.trim() === 'Complete Mission',
    ) as HTMLButtonElement;
    expect(complete).toBeTruthy();
    complete.click();
    fixture.detectChanges();
    expect(completeMissionFn).toHaveBeenCalledWith(1);
  });

  it('should show Launch Minigame button after completion when minigame exists', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const launch = buttons.find(
      (b) => b.textContent?.trim() === 'Launch Minigame',
    ) as HTMLButtonElement;
    expect(launch).toBeTruthy();
  });

  it('should navigate to /minigames/:gameId when Launch Minigame is clicked', async () => {
    const { element, fixture, component, navigateFn } = await setup();
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const launch = buttons.find(
      (b) => b.textContent?.trim() === 'Launch Minigame',
    ) as HTMLButtonElement;
    launch.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
  });

  it('should show "Mission Complete!" when no minigame to unlock', async () => {
    const { element, fixture, component } = await setup({
      chapterId: '9',
      chapterMeta: TEST_CHAPTER_META_NO_MINIGAME,
    });
    // Chapter 9 has same content as chapter 1 (via PHASE_1_MISSIONS lookup)
    // but missionMeta returns no-minigame metadata
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const msg = element.querySelector('.mission__completed-msg');
    expect(msg?.textContent?.trim()).toBe('Mission Complete!');
  });

  it('should show completed state if mission was already completed (isCompleted=true)', async () => {
    const { element } = await setup({ isCompleted: true });
    // When mission is already completed, the component shows the mission content
    // and the footer should show the completed/launch state
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const launch = buttons.find(
      (b) => b.textContent?.trim() === 'Launch Minigame',
    ) as HTMLButtonElement;
    expect(launch).toBeTruthy();
  });

  // === Error handling (1 test) ===

  it('should display error message when completeMission throws', async () => {
    const completeMissionFn = vi.fn(() => {
      throw new Error('Prerequisites not met');
    });
    const { element, fixture, component } = await setup({ completeMissionFn });
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const error = element.querySelector('.mission__error');
    expect(error).toBeTruthy();
    expect(error?.textContent).toContain('Prerequisites not met');
  });

  // === Locked state (2 tests) ===

  it('should show LockedContentComponent when mission is not available', async () => {
    const { element } = await setup({ isAvailable: false });
    const locked = element.querySelector('nx-locked-content');
    expect(locked).toBeTruthy();
  });

  it('should display prerequisite message showing the prerequisite chapter title', async () => {
    const { component } = await setup({
      isAvailable: false,
      prerequisites: [1 as ChapterId],
      chapterId: '2',
      chapterMeta: {
        chapterId: 2,
        title: 'Wire Up Life Support',
        angularTopic: 'Interpolation',
        narrative: 'Display live sensor data',
        unlocksMinigame: 'module-assembly',
        deps: [1],
        phase: 1,
      },
    });
    expect(component.prerequisiteMessage()).toContain('Complete "Build the Emergency Shelter" first');
  });

  // === Edge cases (2 tests) ===

  it('should show not-found message for invalid chapterId', async () => {
    const { element } = await setup({ chapterId: '999' });
    const notFound = element.querySelector('.mission__not-found');
    expect(notFound).toBeTruthy();
    expect(notFound?.textContent).toContain('Mission not found for chapter 999');
  });

  it('should handle missing route param gracefully', async () => {
    const { element } = await setup({ chapterId: '' });
    const notFound = element.querySelector('.mission__not-found');
    expect(notFound).toBeTruthy();
    expect(notFound?.textContent).toContain('Mission not found for chapter 0');
  });
});
