import { Component, signal } from '@angular/core';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../../testing/test-utils';
import { OnboardingService } from '../../../core/progression/onboarding.service';
import { ONBOARDING_STEP_ORDER } from '../../../core/progression/onboarding.service';
import { OnboardingOverlayComponent } from './onboarding-overlay';

@Component({
  template: `
    @if (show) {
      <nx-onboarding-overlay (dismissed)="onDismiss()" />
    }
  `,
  imports: [OnboardingOverlayComponent],
})
class TestHost {
  show = true;
  onDismiss = vi.fn();
}

function createMockOnboardingService(isComplete = false) {
  return {
    isOnboardingComplete: signal(isComplete),
    completeStep: vi.fn(),
  };
}

async function setup(isComplete = false) {
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

  const mockService = createMockOnboardingService(isComplete);

  const result = await createComponent(TestHost, {
    providers: [getMockProvider(OnboardingService, mockService)],
  });
  await result.fixture.whenStable();

  const dialogEl = result.element.querySelector('dialog') as HTMLDialogElement;
  return { ...result, dialogEl, showModalSpy, closeSpy, mockService };
}

function clickButton(dialogEl: HTMLDialogElement, selector: string): void {
  const btn = dialogEl.querySelector(selector) as HTMLButtonElement;
  btn.click();
}

describe('OnboardingOverlayComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Rendering ---

  it('should render the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should display the first step title and description', async () => {
    const { dialogEl } = await setup();
    const title = dialogEl.querySelector('#onboarding-step-title');
    expect(title?.textContent).toContain('Welcome to Nexus Station');
    const desc = dialogEl.querySelector('.onboarding__description');
    expect(desc?.textContent).toContain('Systems Engineer');
  });

  it('should render step indicator with correct initial count', async () => {
    const { dialogEl } = await setup();
    const indicator = dialogEl.querySelector('.onboarding__indicator');
    expect(indicator?.textContent).toContain('Step 1 of 6');
  });

  it('should render Next and Skip buttons', async () => {
    const { dialogEl } = await setup();
    const nextBtn = dialogEl.querySelector('.onboarding__btn--next') as HTMLButtonElement;
    expect(nextBtn).toBeTruthy();
    expect(nextBtn.textContent?.trim()).toBe('Next');
    const skipBtn = dialogEl.querySelector('.onboarding__btn--skip') as HTMLButtonElement;
    expect(skipBtn).toBeTruthy();
    expect(skipBtn.textContent?.trim()).toBe('Skip');
  });

  // --- Step Navigation ---

  it('should advance to next step when Next button clicked', async () => {
    const { dialogEl, fixture } = await setup();
    clickButton(dialogEl, '.onboarding__btn--next');
    fixture.detectChanges();
    await fixture.whenStable();
    const title = dialogEl.querySelector('#onboarding-step-title');
    expect(title?.textContent).toContain('Story Missions');
    const indicator = dialogEl.querySelector('.onboarding__indicator');
    expect(indicator?.textContent).toContain('Step 2 of 6');
  });

  it('should update step indicator on each navigation', async () => {
    const { dialogEl, fixture } = await setup();
    // Navigate to step 3
    clickButton(dialogEl, '.onboarding__btn--next');
    fixture.detectChanges();
    clickButton(dialogEl, '.onboarding__btn--next');
    fixture.detectChanges();
    await fixture.whenStable();
    const indicator = dialogEl.querySelector('.onboarding__indicator');
    expect(indicator?.textContent).toContain('Step 3 of 6');
  });

  it('should show Done label on Next button when on last step', async () => {
    const { dialogEl, fixture } = await setup();
    // Navigate to step 6 (last)
    for (let i = 0; i < 5; i++) {
      clickButton(dialogEl, '.onboarding__btn--next');
      fixture.detectChanges();
    }
    await fixture.whenStable();
    const nextBtn = dialogEl.querySelector('.onboarding__btn--next') as HTMLButtonElement;
    expect(nextBtn.textContent?.trim()).toBe('Done');
  });

  it('should complete onboarding and emit dismissed when Done clicked on last step', async () => {
    const { dialogEl, fixture, component, mockService } = await setup();
    // Navigate to last step
    for (let i = 0; i < 5; i++) {
      clickButton(dialogEl, '.onboarding__btn--next');
      fixture.detectChanges();
    }
    // Click Done
    clickButton(dialogEl, '.onboarding__btn--next');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockService.completeStep).toHaveBeenCalledTimes(ONBOARDING_STEP_ORDER.length);
    expect((component as TestHost).onDismiss).toHaveBeenCalled();
  });

  // --- Skip ---

  it('should complete all steps and emit dismissed when Skip clicked', async () => {
    const { dialogEl, fixture, component, mockService } = await setup();
    clickButton(dialogEl, '.onboarding__btn--skip');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockService.completeStep).toHaveBeenCalledTimes(ONBOARDING_STEP_ORDER.length);
    expect((component as TestHost).onDismiss).toHaveBeenCalled();
  });

  it('should complete all steps when Skip clicked from a middle step', async () => {
    const { dialogEl, fixture, component, mockService } = await setup();
    // Navigate to step 3
    clickButton(dialogEl, '.onboarding__btn--next');
    fixture.detectChanges();
    clickButton(dialogEl, '.onboarding__btn--next');
    fixture.detectChanges();
    // Skip from step 3
    clickButton(dialogEl, '.onboarding__btn--skip');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockService.completeStep).toHaveBeenCalledTimes(ONBOARDING_STEP_ORDER.length);
    expect((component as TestHost).onDismiss).toHaveBeenCalled();
  });

  // --- Completion Persistence ---

  it('should call completeStep for every OnboardingStep on finish', async () => {
    const { dialogEl, fixture, mockService } = await setup();
    // Navigate to last step and click Done
    for (let i = 0; i < 5; i++) {
      clickButton(dialogEl, '.onboarding__btn--next');
      fixture.detectChanges();
    }
    clickButton(dialogEl, '.onboarding__btn--next');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockService.completeStep).toHaveBeenCalledTimes(6);
    for (const step of ONBOARDING_STEP_ORDER) {
      expect(mockService.completeStep).toHaveBeenCalledWith(step);
    }
  });

  it('should call completeStep for every OnboardingStep on skip', async () => {
    const { dialogEl, fixture, mockService } = await setup();
    clickButton(dialogEl, '.onboarding__btn--skip');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockService.completeStep).toHaveBeenCalledTimes(6);
    for (const step of ONBOARDING_STEP_ORDER) {
      expect(mockService.completeStep).toHaveBeenCalledWith(step);
    }
  });

  // --- Accessibility ---

  it('should use native dialog element', async () => {
    const { dialogEl } = await setup();
    expect(dialogEl).toBeTruthy();
    expect(dialogEl.tagName).toBe('DIALOG');
  });

  it('should have aria-labelledby pointing to step title', async () => {
    const { dialogEl } = await setup();
    expect(dialogEl.getAttribute('aria-labelledby')).toBe('onboarding-step-title');
    const titleEl = dialogEl.querySelector('#onboarding-step-title');
    expect(titleEl).toBeTruthy();
  });

  it('should have aria-live region on step indicator', async () => {
    const { dialogEl } = await setup();
    const indicator = dialogEl.querySelector('.onboarding__indicator');
    expect(indicator).toBeTruthy();
    // role="status" implicitly provides aria-live="polite"
    expect(indicator?.getAttribute('role')).toBe('status');
  });

  // --- Edge Case ---

  it('should not render content if onboarding is already complete', async () => {
    const { component, element } = await setup(true);
    expect((component as TestHost).onDismiss).toHaveBeenCalled();
    // Dialog should not be present or should not have step content
    const title = element.querySelector('#onboarding-step-title');
    expect(title).toBeFalsy();
  });
});
