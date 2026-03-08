import { Component } from '@angular/core';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../../testing/test-utils';
import { StatePersistenceService } from '../../../core/persistence/state-persistence.service';
import type { MinigameId } from '../../../core/minigame/minigame.types';
import { MinigameTutorialOverlayComponent } from './minigame-tutorial';
import type { TutorialStep } from './minigame-tutorial.types';

@Component({
  template: `
    @if (show) {
      <nx-minigame-tutorial
        [gameId]="gameId"
        [steps]="steps"
        (dismissed)="onDismiss()" />
    }
  `,
  imports: [MinigameTutorialOverlayComponent],
})
class TestHost {
  show = true;
  gameId: MinigameId = 'module-assembly';
  steps: TutorialStep[] = [
    { title: 'Step 1', description: 'First step' },
    { title: 'Step 2', description: 'Second step' },
    { title: 'Step 3', description: 'Third step' },
  ];
  onDismiss = vi.fn();
}

@Component({
  template: `
    @if (show) {
      <nx-minigame-tutorial
        [gameId]="gameId"
        [steps]="steps"
        (dismissed)="onDismiss()" />
    }
  `,
  imports: [MinigameTutorialOverlayComponent],
})
class TestHostSingleStep {
  show = true;
  gameId: MinigameId = 'wire-protocol';
  steps: TutorialStep[] = [{ title: 'Only Step', description: 'One and done' }];
  onDismiss = vi.fn();
}

@Component({
  template: `
    @if (show) {
      <nx-minigame-tutorial
        [gameId]="gameId"
        [steps]="steps"
        (dismissed)="onDismiss()" />
    }
  `,
  imports: [MinigameTutorialOverlayComponent],
})
class TestHostEmpty {
  show = true;
  gameId: MinigameId = 'flow-commander';
  steps: TutorialStep[] = [];
  onDismiss = vi.fn();
}

@Component({
  template: `
    @if (show) {
      <nx-minigame-tutorial
        [gameId]="gameId"
        [steps]="steps"
        (dismissed)="onDismiss()" />
    }
  `,
  imports: [MinigameTutorialOverlayComponent],
})
class TestHostWithImage {
  show = true;
  gameId: MinigameId = 'module-assembly';
  steps: TutorialStep[] = [
    { title: 'Step 1', description: 'With image', image: '/assets/tutorial/step1.png' },
    { title: 'Step 2', description: 'No image' },
  ];
  onDismiss = vi.fn();
}

const mockPersistence = {
  save: vi.fn(),
  load: vi.fn().mockReturnValue(null),
};

async function setup(hostClass: typeof TestHost | typeof TestHostSingleStep | typeof TestHostEmpty | typeof TestHostWithImage = TestHost) {
  // Install jsdom polyfills BEFORE component renders
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
    };
  }

  const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
  const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');

  const result = await createComponent(hostClass, {
    providers: [getMockProvider(StatePersistenceService, mockPersistence)],
  });
  await result.fixture.whenStable();

  const dialogEl = result.element.querySelector('dialog') as HTMLDialogElement;
  return { ...result, dialogEl, showModalSpy, closeSpy };
}

describe('MinigameTutorialOverlayComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockPersistence.save.mockClear();
    mockPersistence.load.mockClear();
  });

  // --- Rendering ---

  it('should render the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display the first step title and description', async () => {
    const { dialogEl } = await setup();
    const title = dialogEl.querySelector('#tutorial-step-title');
    expect(title?.textContent).toContain('Step 1');
    const desc = dialogEl.querySelector('.tutorial__description');
    expect(desc?.textContent).toContain('First step');
  });

  it('should render step indicator with correct count', async () => {
    const { dialogEl } = await setup();
    const indicator = dialogEl.querySelector('.tutorial__indicator');
    expect(indicator?.textContent).toContain('1 / 3');
  });

  it('should render previous button disabled on first step', async () => {
    const { dialogEl } = await setup();
    const prevBtn = dialogEl.querySelector('.tutorial__btn--prev') as HTMLButtonElement;
    expect(prevBtn).toBeTruthy();
    expect(prevBtn.disabled).toBe(true);
  });

  it('should render next button', async () => {
    const { dialogEl } = await setup();
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    expect(nextBtn).toBeTruthy();
    expect(nextBtn.textContent?.trim()).toBe('Next');
  });

  it('should render skip button', async () => {
    const { dialogEl } = await setup();
    const skipBtn = dialogEl.querySelector('.tutorial__btn--skip') as HTMLButtonElement;
    expect(skipBtn).toBeTruthy();
    expect(skipBtn.textContent?.trim()).toBe('Skip');
  });

  it('should render "Don\'t show again" checkbox unchecked by default', async () => {
    const { dialogEl } = await setup();
    const checkbox = dialogEl.querySelector('#dont-show-again') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.type).toBe('checkbox');
    expect(checkbox.checked).toBe(false);
    const label = dialogEl.querySelector('label[for="dont-show-again"]');
    expect(label).toBeTruthy();
  });

  it('should render optional image when step has image property', async () => {
    const { dialogEl } = await setup(TestHostWithImage);
    const img = dialogEl.querySelector('.tutorial__image') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('/assets/tutorial/step1.png');
  });

  it('should NOT render image element when step has no image', async () => {
    const { dialogEl, fixture } = await setup(TestHostWithImage);
    // Navigate to step 2 (no image)
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const img = dialogEl.querySelector('.tutorial__image');
    expect(img).toBeFalsy();
  });

  // --- Step Navigation ---

  it('should advance to next step when next button clicked', async () => {
    const { dialogEl, fixture } = await setup();
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const title = dialogEl.querySelector('#tutorial-step-title');
    expect(title?.textContent).toContain('Step 2');
    const indicator = dialogEl.querySelector('.tutorial__indicator');
    expect(indicator?.textContent).toContain('2 / 3');
  });

  it('should go back to previous step when previous button clicked', async () => {
    const { dialogEl, fixture } = await setup();
    // Go to step 2
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    // Go back to step 1
    const prevBtn = dialogEl.querySelector('.tutorial__btn--prev') as HTMLButtonElement;
    prevBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const title = dialogEl.querySelector('#tutorial-step-title');
    expect(title?.textContent).toContain('Step 1');
  });

  it('should disable previous button on first step', async () => {
    const { dialogEl } = await setup();
    const prevBtn = dialogEl.querySelector('.tutorial__btn--prev') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('should show "Finish" label on next button when on last step', async () => {
    const { dialogEl, fixture } = await setup();
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    // Go to step 2
    nextBtn.click();
    fixture.detectChanges();
    // Go to step 3 (last)
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(nextBtn.textContent?.trim()).toBe('Finish');
  });

  it('should emit dismissed when next/finish clicked on last step', async () => {
    const { dialogEl, fixture, component } = await setup();
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    // Navigate to last step
    nextBtn.click();
    fixture.detectChanges();
    nextBtn.click();
    fixture.detectChanges();
    // Click finish
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((component as TestHost).onDismiss).toHaveBeenCalled();
  });

  // --- Skip ---

  it('should emit dismissed when skip button clicked', async () => {
    const { dialogEl, fixture, component } = await setup();
    const skipBtn = dialogEl.querySelector('.tutorial__btn--skip') as HTMLButtonElement;
    skipBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((component as TestHost).onDismiss).toHaveBeenCalled();
  });

  it('should emit dismissed regardless of current step', async () => {
    const { dialogEl, fixture, component } = await setup();
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    // Skip from step 2
    const skipBtn = dialogEl.querySelector('.tutorial__btn--skip') as HTMLButtonElement;
    skipBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((component as TestHost).onDismiss).toHaveBeenCalled();
  });

  // --- Don't Show Again Persistence ---

  it('should persist when finish clicked with checkbox checked', async () => {
    const { dialogEl, fixture } = await setup();
    // Check the checkbox
    const checkbox = dialogEl.querySelector('#dont-show-again') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    // Navigate to last step and finish
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    nextBtn.click();
    fixture.detectChanges();
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockPersistence.save).toHaveBeenCalledWith('tutorial-seen:module-assembly', true);
  });

  it('should NOT persist when finish clicked with checkbox unchecked', async () => {
    const { dialogEl, fixture } = await setup();
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    nextBtn.click();
    fixture.detectChanges();
    nextBtn.click();
    fixture.detectChanges();
    nextBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockPersistence.save).not.toHaveBeenCalled();
  });

  it('should persist on skip when checkbox is checked', async () => {
    const { dialogEl, fixture } = await setup();
    const checkbox = dialogEl.querySelector('#dont-show-again') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    const skipBtn = dialogEl.querySelector('.tutorial__btn--skip') as HTMLButtonElement;
    skipBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockPersistence.save).toHaveBeenCalledWith('tutorial-seen:module-assembly', true);
  });

  it('should NOT persist on skip when checkbox is unchecked', async () => {
    const { dialogEl, fixture } = await setup();
    const skipBtn = dialogEl.querySelector('.tutorial__btn--skip') as HTMLButtonElement;
    skipBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockPersistence.save).not.toHaveBeenCalled();
  });

  // --- Edge Cases ---

  it('should handle single-step tutorial', async () => {
    const { dialogEl } = await setup(TestHostSingleStep);
    const title = dialogEl.querySelector('#tutorial-step-title');
    expect(title?.textContent).toContain('Only Step');
    const prevBtn = dialogEl.querySelector('.tutorial__btn--prev') as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    const nextBtn = dialogEl.querySelector('.tutorial__btn--next') as HTMLButtonElement;
    expect(nextBtn.textContent?.trim()).toBe('Finish');
    const indicator = dialogEl.querySelector('.tutorial__indicator');
    expect(indicator?.textContent).toContain('1 / 1');
  });

  it('should handle empty steps array gracefully', async () => {
    const { component } = await setup(TestHostEmpty);
    expect((component as TestHostEmpty).onDismiss).toHaveBeenCalled();
  });

  // --- Accessibility ---

  it('should use native dialog element', async () => {
    const { dialogEl } = await setup();
    expect(dialogEl).toBeTruthy();
    expect(dialogEl.tagName).toBe('DIALOG');
  });

  it('should have aria-labelledby pointing to step title element', async () => {
    const { dialogEl } = await setup();
    expect(dialogEl.getAttribute('aria-labelledby')).toBe('tutorial-step-title');
    const titleEl = dialogEl.querySelector('#tutorial-step-title');
    expect(titleEl).toBeTruthy();
  });
});
