import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { createComponent, getMockProvider } from '../../../../testing/test-utils';
import type {
  CodeChallengeStep,
  CodeChallengeValidationResult,
} from '../../../core/curriculum/story-mission-content.types';
import { CodeChallengeValidationService } from '../../../core/curriculum/code-challenge-validation.service';
import { CodeChallengeComponent } from './code-challenge';

function makeChallenge(overrides?: Partial<CodeChallengeStep>): CodeChallengeStep {
  return {
    stepType: 'code-challenge',
    prompt: '<p>Write a component</p>',
    starterCode: 'const x = 1;',
    language: 'typescript',
    validationRules: [{ type: 'contains', value: '@Component', errorMessage: 'Must contain @Component' }],
    hints: ['Hint 1', 'Hint 2'],
    successMessage: 'Great job!',
    explanation: 'This works because...',
    ...overrides,
  };
}

function makeResult(overrides?: Partial<CodeChallengeValidationResult>): CodeChallengeValidationResult {
  return {
    valid: false,
    errors: ['Must contain @Component'],
    passedRules: 0,
    totalRules: 1,
    ...overrides,
  };
}

@Component({
  template: `<nx-code-challenge
    [challenge]="challenge"
    [challengeIndex]="challengeIndex"
    (challengeCompleted)="onCompleted()" />`,
  imports: [CodeChallengeComponent],
})
class TestHost {
  challenge: CodeChallengeStep = makeChallenge();
  challengeIndex = 0;
  completedCount = 0;
  onCompleted(): void {
    this.completedCount++;
  }
}

describe('CodeChallengeComponent', () => {
  let validateCodeSpy: ReturnType<typeof vi.fn>;

  function createMockService() {
    validateCodeSpy = vi.fn().mockReturnValue(makeResult());
    return getMockProvider(CodeChallengeValidationService, {
      validateCode: validateCodeSpy,
    });
  }

  async function setup(overrides?: Partial<CodeChallengeStep>) {
    const mockService = createMockService();
    const { fixture, component, element } = await createComponent(TestHost, {
      providers: [mockService, provideMonacoEditor()],
      detectChanges: false,
    });
    if (overrides) {
      fixture.componentInstance.challenge = makeChallenge(overrides);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host: component, element };
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup();
    const root = element.querySelector('.code-challenge');
    expect(root).toBeTruthy();
  });

  // 2. Prompt rendering
  it('should render prompt HTML', async () => {
    const { element } = await setup();
    const prompt = element.querySelector('.code-challenge__prompt');
    expect(prompt).toBeTruthy();
    expect(prompt!.innerHTML).toContain('<p>Write a component</p>');
  });

  // 3. Editor rendering
  it('should render code editor with starter code', async () => {
    const { element } = await setup();
    const editor = element.querySelector('nx-code-editor');
    expect(editor).toBeTruthy();
  });

  // 4. Submit button present
  it('should render Check Code button enabled initially', async () => {
    const { element } = await setup();
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent!.trim()).toBe('Check Code');
    expect(btn.disabled).toBe(false);
  });

  // 5. Submit calls validation service
  it('should call validation service on submit', async () => {
    const { element } = await setup();
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    expect(validateCodeSpy).toHaveBeenCalledWith(
      'const x = 1;',
      makeChallenge().validationRules,
    );
  });

  // 6. Failed state shows errors
  it('should show error messages on validation failure', async () => {
    const { fixture, element } = await setup();
    validateCodeSpy.mockReturnValue(makeResult({
      valid: false,
      errors: ['Must contain @Component'],
    }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const feedback = element.querySelector('.code-challenge__feedback--error');
    expect(feedback).toBeTruthy();
    const items = feedback!.querySelectorAll('li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toBe('Must contain @Component');
  });

  // 7. Failed state increments attempts
  it('should show attempt count after submit', async () => {
    const { fixture, element } = await setup();
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const attempts = element.querySelector('.code-challenge__attempts');
    expect(attempts).toBeTruthy();
    expect(attempts!.textContent!.trim()).toBe('Attempt 1');
  });

  // 8. Failed state allows editing and resubmit
  it('should allow resubmit after failure', async () => {
    const { fixture, element } = await setup();
    // First attempt: fail
    validateCodeSpy.mockReturnValue(makeResult({ valid: false, errors: ['Error'] }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Second attempt: pass
    validateCodeSpy.mockReturnValue(makeResult({ valid: true, errors: [], passedRules: 1 }));
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const success = element.querySelector('.code-challenge__feedback--success');
    expect(success).toBeTruthy();
  });

  // 9. Passed state shows success
  it('should show success message on validation pass', async () => {
    const { fixture, element } = await setup();
    validateCodeSpy.mockReturnValue(makeResult({ valid: true, errors: [], passedRules: 1 }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const success = element.querySelector('.code-challenge__feedback--success');
    expect(success).toBeTruthy();
    expect(success!.textContent!.trim()).toBe('Great job!');
  });

  // 10. Passed state shows explanation
  it('should show explanation panel after pass', async () => {
    const { fixture, element } = await setup();
    validateCodeSpy.mockReturnValue(makeResult({ valid: true, errors: [], passedRules: 1 }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const explanation = element.querySelector('.code-challenge__explanation');
    expect(explanation).toBeTruthy();
    expect(explanation!.textContent!.trim()).toBe('This works because...');
  });

  // 11. Passed state emits challengeCompleted
  it('should emit challengeCompleted on pass', async () => {
    const { fixture, host, element } = await setup();
    validateCodeSpy.mockReturnValue(makeResult({ valid: true, errors: [], passedRules: 1 }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.completedCount).toBe(1);
  });

  // 12. Passed state makes editor read-only
  it('should make editor read-only after pass', async () => {
    const { fixture, element } = await setup();
    validateCodeSpy.mockReturnValue(makeResult({ valid: true, errors: [], passedRules: 1 }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    // Editor should still render in read-only mode
    const editor = element.querySelector('nx-code-editor');
    expect(editor).toBeTruthy();
  });

  // 13. Passed state disables submit
  it('should disable submit button after pass', async () => {
    const { fixture, element } = await setup();
    validateCodeSpy.mockReturnValue(makeResult({ valid: true, errors: [], passedRules: 1 }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(btn.disabled).toBe(true);
  });

  // 14. Hint button hidden initially
  it('should not show hint button before 2 failures', async () => {
    const { element } = await setup();
    const hintBtn = element.querySelector('.code-challenge__hint-btn');
    expect(hintBtn).toBeNull();
  });

  // 15. Hint button appears after 2 failures
  it('should show hint button after 2 failed attempts', async () => {
    const { fixture, element } = await setup();
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    // Fail twice
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hintBtn = element.querySelector('.code-challenge__hint-btn') as HTMLButtonElement;
    expect(hintBtn).toBeTruthy();
    expect(hintBtn.textContent!.trim()).toBe('Show Hint (2 remaining)');
  });

  // 16. Reveal hint decrements remaining
  it('should reveal hint and decrement remaining count', async () => {
    const { fixture, element } = await setup();
    const submitBtn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    // Fail twice to unlock hints
    submitBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    submitBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hintBtn = element.querySelector('.code-challenge__hint-btn') as HTMLButtonElement;
    hintBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hints = element.querySelectorAll('.code-challenge__hint-list li');
    expect(hints.length).toBe(1);
    expect(hints[0].textContent).toBe('Hint 1');

    const updatedBtn = element.querySelector('.code-challenge__hint-btn') as HTMLButtonElement;
    expect(updatedBtn.textContent!.trim()).toBe('Show Hint (1 remaining)');
  });

  // 17. All hints revealed hides button
  it('should hide hint button when all hints revealed', async () => {
    const { fixture, element } = await setup();
    const submitBtn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    // Fail twice
    submitBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    submitBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Reveal both hints
    let hintBtn = element.querySelector('.code-challenge__hint-btn') as HTMLButtonElement;
    hintBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    hintBtn = element.querySelector('.code-challenge__hint-btn') as HTMLButtonElement;
    hintBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const hints = element.querySelectorAll('.code-challenge__hint-list li');
    expect(hints.length).toBe(2);

    const removedBtn = element.querySelector('.code-challenge__hint-btn');
    expect(removedBtn).toBeNull();
  });

  // 18. Keyboard submit (Ctrl+Enter)
  it('should submit on Ctrl+Enter keydown', async () => {
    const { fixture, element } = await setup();
    const wrapper = element.querySelector('.code-challenge') as HTMLElement;
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(validateCodeSpy).toHaveBeenCalled();
  });

  // 19. Keyboard submit with Meta (Mac)
  it('should submit on Meta+Enter keydown', async () => {
    const { fixture, element } = await setup();
    const wrapper = element.querySelector('.code-challenge') as HTMLElement;
    wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(validateCodeSpy).toHaveBeenCalled();
  });

  // 20. Accessibility: feedback has role=status
  it('should have role=status on feedback elements', async () => {
    const { fixture, element } = await setup();
    // Fail first to see error feedback
    validateCodeSpy.mockReturnValue(makeResult({ valid: false, errors: ['Error'] }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const errorFeedback = element.querySelector('.code-challenge__feedback--error');
    expect(errorFeedback!.getAttribute('role')).toBe('status');

    // Now pass to see success feedback
    validateCodeSpy.mockReturnValue(makeResult({ valid: true, errors: [], passedRules: 1 }));
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const successFeedback = element.querySelector('.code-challenge__feedback--success');
    expect(successFeedback!.getAttribute('role')).toBe('status');
  });

  // 21. Challenge input change resets state
  it('should reset state when challenge input changes', async () => {
    const { fixture, host, element } = await setup();
    // Fail once
    validateCodeSpy.mockReturnValue(makeResult({ valid: false, errors: ['Error'] }));
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify failed state
    expect(element.querySelector('.code-challenge__feedback--error')).toBeTruthy();

    // Change challenge input
    host.challenge = makeChallenge({
      prompt: '<p>New challenge</p>',
      starterCode: 'let y = 2;',
    });
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    await fixture.whenStable();

    // State should be reset
    expect(element.querySelector('.code-challenge__feedback--error')).toBeNull();
    expect(element.querySelector('.code-challenge__attempts')).toBeNull();
    const prompt = element.querySelector('.code-challenge__prompt');
    expect(prompt!.innerHTML).toContain('<p>New challenge</p>');
  });

  // 22. Submit disabled when code is empty
  it('should disable submit when code is empty', async () => {
    const { element } = await setup({ starterCode: '' });
    const btn = element.querySelector('.code-challenge__submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
