import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent, getMockProvider, TestBed } from '../../../testing/test-utils';
import { MissionPage } from './mission';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { CurriculumService } from '../../core/curriculum/curriculum.service';
import { StoryMissionCompletionService, type MissionCompletionSummary } from '../../core/curriculum/story-mission-completion.service';
import { StoryMissionContentService } from '../../core/curriculum/story-mission-content.service';
import type { ChapterId, StoryMission } from '../../core/curriculum/curriculum.types';
import type { StoryMissionContent } from '../../core/curriculum/story-mission-content.types';
import { CHAPTER_01_CONTENT, PHASE_1_MISSIONS } from '../../data/missions/phase-1';
import { provideMissionContent } from '../../data/missions';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameId } from '../../core/minigame/minigame.types';
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
  completeMissionFn?: (...args: unknown[]) => MissionCompletionSummary | void;
  extraMissionContent?: StoryMissionContent[];
  minigameRegistryOverrides?: Partial<Record<keyof MinigameRegistryService, unknown>>;
}

async function setup(options: SetupOptions = {}) {
  const {
    chapterId = '1',
    isAvailable = true,
    isCompleted = false,
    completedMissions = new Set<ChapterId>(),
    chapterMeta = TEST_CHAPTER_META,
    prerequisites = [],
    completeMissionFn = vi.fn(() => ({
      xpAwarded: 50,
      unlockedMinigame: null,
      masteryAwarded: false,
      alreadyCompleted: false,
    })),
    extraMissionContent = [],
    minigameRegistryOverrides = {
      getConfig: (gameId: MinigameId) => {
        if (gameId === 'module-assembly') return { id: 'module-assembly', name: 'Module Assembly' };
        return undefined;
      },
    },
  } = options;

  const paramMapSubject = new BehaviorSubject(convertToParamMap({ chapterId }));
  const navigateFn = vi.fn();

  const completedMissionsSignal: WritableSignal<ReadonlySet<ChapterId>> = signal(completedMissions);

  const needsExtraContent = extraMissionContent.length > 0;

  const result = await createComponent(MissionPage, {
    providers: [
      ...ICON_PROVIDERS,
      provideMissionContent(PHASE_1_MISSIONS),
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
      getMockProvider(MinigameRegistryService, minigameRegistryOverrides),
      getMockProvider(Router, {
        navigate: navigateFn,
      }),
    ],
    detectChanges: !needsExtraContent,
  });

  if (needsExtraContent) {
    TestBed.inject(StoryMissionContentService).registerContent(extraMissionContent);
    result.fixture.detectChanges();
    await result.fixture.whenStable();
  }

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

  it('should render StepProgressComponent in the header', async () => {
    const { element } = await setup();
    const stepProgress = element.querySelector('.mission__header nx-step-progress');
    expect(stepProgress).toBeTruthy();
    expect(stepProgress?.getAttribute('role')).toBe('progressbar');
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

  it('should display minigame name in Launch button label after completion', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const launch = buttons.find(
      (b) => b.textContent?.trim() === 'Launch Module Assembly',
    ) as HTMLButtonElement;
    expect(launch).toBeTruthy();
  });

  it('should navigate to /minigames/:gameId when Launch button is clicked', async () => {
    const { element, fixture, component, navigateFn } = await setup();
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const launch = buttons.find(
      (b) => b.textContent?.trim() === 'Launch Module Assembly',
    ) as HTMLButtonElement;
    launch.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
  });

  it('should show Continue to Next Mission button for non-unlock chapters after completion', async () => {
    const { element, fixture, component } = await setup({
      chapterId: '9',
      chapterMeta: TEST_CHAPTER_META_NO_MINIGAME,
    });
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const continueBtn = element.querySelector('.mission__continue-btn') as HTMLButtonElement;
    expect(continueBtn).toBeTruthy();
    expect(continueBtn.textContent?.trim()).toBe('Continue to Next Mission');
    expect(continueBtn.disabled).toBe(true);
  });

  it('should show Launch button with minigame name when revisiting completed mission (isCompleted=true)', async () => {
    const { element } = await setup({ isCompleted: true });
    const buttons = Array.from(element.querySelectorAll('footer button'));
    const launch = buttons.find(
      (b) => b.textContent?.trim() === 'Launch Module Assembly',
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

  // === Completion result storage (3 tests) ===

  it('should store MissionCompletionSummary in completionResult signal after completion', async () => {
    const summary: MissionCompletionSummary = {
      xpAwarded: 50,
      unlockedMinigame: 'module-assembly',
      masteryAwarded: true,
      alreadyCompleted: false,
    };
    const completeMissionFn = vi.fn(() => summary);
    const { component } = await setup({ completeMissionFn });
    component.nextStep();
    component.nextStep();
    component.nextStep();
    component.completeMission();
    expect(component.completionResult()).toEqual(summary);
  });

  it('should update completionResult with alreadyCompleted when completing again', async () => {
    const firstSummary: MissionCompletionSummary = {
      xpAwarded: 50,
      unlockedMinigame: null,
      masteryAwarded: false,
      alreadyCompleted: false,
    };
    const secondSummary: MissionCompletionSummary = {
      xpAwarded: 0,
      unlockedMinigame: null,
      masteryAwarded: false,
      alreadyCompleted: true,
    };
    const completeMissionFn = vi.fn()
      .mockReturnValueOnce(firstSummary)
      .mockReturnValueOnce(secondSummary);
    const { component } = await setup({ completeMissionFn });
    component.nextStep();
    component.nextStep();
    component.nextStep();

    component.completeMission();
    expect(component.completionResult()?.alreadyCompleted).toBe(false);

    component.completeMission();
    expect(component.completionResult()?.alreadyCompleted).toBe(true);
  });

  it('should leave completionResult as null when completeMission throws', async () => {
    const completeMissionFn = vi.fn(() => {
      throw new Error('fail');
    });
    const { component } = await setup({ completeMissionFn });
    component.nextStep();
    component.nextStep();
    component.nextStep();
    component.completeMission();
    expect(component.completionResult()).toBeNull();
    expect(component.errorMessage()).toBe('fail');
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

  // === Multi-block code examples (3 tests) ===

  it('should render multiple code editors when codeBlocks is present', async () => {
    const testMission: StoryMissionContent = {
      chapterId: 99 as ChapterId,
      steps: [{
        stepType: 'code-example',
        narrativeText: 'Test narrative',
        code: 'fallback',
        language: 'typescript',
        explanation: 'test explanation',
        codeBlocks: [
          { code: 'const a = 1;', language: 'typescript', label: 'Before' },
          { code: 'const a = 2;', language: 'typescript', label: 'After' },
        ],
      }],
      completionCriteria: { description: 'Test completion', minStepsViewed: 1 },
    };

    const { element } = await setup({
      chapterId: '99',
      chapterMeta: {
        chapterId: 99,
        title: 'Test Mission',
        angularTopic: 'Testing',
        narrative: 'Test',
        unlocksMinigame: null,
        deps: [],
        phase: 1,
      },
      extraMissionContent: [testMission],
    });

    const codeEditors = element.querySelectorAll('nx-code-editor');
    expect(codeEditors.length).toBe(2);
  });

  it('should display labels for code blocks with labels', async () => {
    const testMission: StoryMissionContent = {
      chapterId: 99 as ChapterId,
      steps: [{
        stepType: 'code-example',
        narrativeText: 'Test narrative',
        code: 'fallback',
        language: 'typescript',
        explanation: 'test explanation',
        codeBlocks: [
          { code: 'const a = 1;', language: 'typescript', label: 'Before' },
          { code: 'const a = 2;', language: 'typescript', label: 'After' },
        ],
      }],
      completionCriteria: { description: 'Test completion', minStepsViewed: 1 },
    };

    const { element } = await setup({
      chapterId: '99',
      chapterMeta: {
        chapterId: 99,
        title: 'Test Mission',
        angularTopic: 'Testing',
        narrative: 'Test',
        unlocksMinigame: null,
        deps: [],
        phase: 1,
      },
      extraMissionContent: [testMission],
    });

    const labels = element.querySelectorAll('.mission__code-label');
    expect(labels.length).toBe(2);
    expect(labels[0].textContent?.trim()).toBe('Before');
    expect(labels[1].textContent?.trim()).toBe('After');
  });

  it('should not render label div when code block has no label', async () => {
    const testMission: StoryMissionContent = {
      chapterId: 98 as ChapterId,
      steps: [{
        stepType: 'code-example',
        narrativeText: 'Test narrative',
        code: 'fallback',
        language: 'typescript',
        explanation: 'test explanation',
        codeBlocks: [
          { code: 'const x = 1;', language: 'typescript' },
          { code: 'const x = 2;', language: 'typescript' },
        ],
      }],
      completionCriteria: { description: 'Test completion', minStepsViewed: 1 },
    };

    const { element } = await setup({
      chapterId: '98',
      chapterMeta: {
        chapterId: 98,
        title: 'Test Mission No Labels',
        angularTopic: 'Testing',
        narrative: 'Test',
        unlocksMinigame: null,
        deps: [],
        phase: 1,
      },
      extraMissionContent: [testMission],
    });

    const labels = element.querySelectorAll('.mission__code-label');
    expect(labels.length).toBe(0);

    const codeEditors = element.querySelectorAll('nx-code-editor');
    expect(codeEditors.length).toBe(2);
  });

  // === Minigame launch button (4 new tests) ===

  it('should not show Launch Minigame button for non-unlock chapters', async () => {
    const { element, fixture, component } = await setup({
      chapterId: '9',
      chapterMeta: TEST_CHAPTER_META_NO_MINIGAME,
    });
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const launchBtn = element.querySelector('.mission__launch-btn');
    expect(launchBtn).toBeFalsy();
  });

  it('should not show Continue to Next Mission button for chapters that unlock a minigame', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const continueBtn = element.querySelector('.mission__continue-btn');
    expect(continueBtn).toBeFalsy();
  });

  it('should apply mission__launch-btn class to the launch button', async () => {
    const { element, fixture, component } = await setup();
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    component.completeMission();
    fixture.detectChanges();
    const launchBtn = element.querySelector('.mission__launch-btn') as HTMLButtonElement;
    expect(launchBtn).toBeTruthy();
    expect(launchBtn.textContent?.trim()).toBe('Launch Module Assembly');
  });

  it('should fall back to "Launch Minigame" if registry lookup returns undefined', async () => {
    const { element, fixture, component } = await setup({
      minigameRegistryOverrides: {
        getConfig: () => undefined,
      },
    });
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

  // === Step progress indicator (6 tests) ===

  it('should bind totalSteps to mission step count', async () => {
    const { element } = await setup();
    const stepProgress = element.querySelector('nx-step-progress');
    expect(stepProgress).toBeTruthy();
    // Chapter 1 has 4 steps; aria-valuemax reflects totalSteps
    expect(stepProgress?.getAttribute('aria-valuemax')).toBe('4');
  });

  it('should bind currentStep as 1-based index', async () => {
    const { element } = await setup();
    const stepProgress = element.querySelector('nx-step-progress');
    expect(stepProgress).toBeTruthy();
    // On initial render (step 0 internally), the first dot should be active
    const dots = stepProgress!.querySelectorAll('.step-progress__dot');
    expect(dots.length).toBe(4);
    expect(dots[0].classList.contains('step-progress__dot--active')).toBe(true);
    expect(dots[1].classList.contains('step-progress__dot--future')).toBe(true);
  });

  it('should update completedSteps when advancing through steps', async () => {
    const { element, fixture, component } = await setup();
    // Navigate from step 0 to step 1
    component.nextStep();
    fixture.detectChanges();

    const stepProgress = element.querySelector('nx-step-progress')!;
    let dots = stepProgress.querySelectorAll('.step-progress__dot');
    // Step 1 (1-based) should now be completed, step 2 active
    expect(dots[0].classList.contains('step-progress__dot--completed')).toBe(true);
    expect(dots[1].classList.contains('step-progress__dot--active')).toBe(true);

    // Navigate to step 2 (0-based)
    component.nextStep();
    fixture.detectChanges();

    dots = stepProgress.querySelectorAll('.step-progress__dot');
    // Steps 1 and 2 completed, step 3 active
    expect(dots[0].classList.contains('step-progress__dot--completed')).toBe(true);
    expect(dots[1].classList.contains('step-progress__dot--completed')).toBe(true);
    expect(dots[2].classList.contains('step-progress__dot--active')).toBe(true);
  });

  it('should preserve completed state when navigating back', async () => {
    const { element, fixture, component } = await setup();
    // Navigate forward to step 3 (0-based), so stepsViewed = 4
    component.nextStep();
    component.nextStep();
    component.nextStep();
    fixture.detectChanges();
    expect(component.stepsViewed()).toBe(4);

    // Now navigate back to step 1 (0-based)
    component.previousStep();
    component.previousStep();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(1);

    const stepProgress = element.querySelector('nx-step-progress')!;
    const dots = stepProgress.querySelectorAll('.step-progress__dot');
    // Step 1 (1-based) should be completed (visited earlier)
    expect(dots[0].classList.contains('step-progress__dot--completed')).toBe(true);
    // Step 2 (1-based) is the current step (0-based step 1), so active
    expect(dots[1].classList.contains('step-progress__dot--active')).toBe(true);
    // Step 3 (1-based) should be completed (visited earlier, stepsViewed=4)
    expect(dots[2].classList.contains('step-progress__dot--completed')).toBe(true);
    // Step 4 (1-based) should be completed (visited earlier, stepsViewed=4)
    expect(dots[3].classList.contains('step-progress__dot--completed')).toBe(true);
  });

  it('should not render StepProgressComponent when mission content is null', async () => {
    const { element } = await setup({ chapterId: '999' });
    const stepProgress = element.querySelector('nx-step-progress');
    expect(stepProgress).toBeFalsy();
  });

  it('should use full variant for step progress', async () => {
    const { element } = await setup();
    const stepProgress = element.querySelector('nx-step-progress');
    expect(stepProgress).toBeTruthy();
    expect(stepProgress!.classList.contains('step-progress--full')).toBe(true);
    // Full variant shows step number labels
    const labels = stepProgress!.querySelectorAll('.step-progress__label');
    expect(labels.length).toBe(4);
  });
});
