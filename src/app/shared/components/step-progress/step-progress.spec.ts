import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { StepProgressComponent } from './step-progress';

@Component({
  template: `<nx-step-progress
    [totalSteps]="totalSteps"
    [currentStep]="currentStep"
    [completedSteps]="completedSteps"
    [variant]="variant" />`,
  imports: [StepProgressComponent],
})
class TestHost {
  totalSteps = 5;
  currentStep = 3;
  completedSteps: number[] = [1, 2];
  variant: 'compact' | 'full' = 'compact';
}

describe('StepProgressComponent', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(TestHost);
    expect(component).toBeTruthy();
  });

  it('should render correct number of step dots', async () => {
    const { element } = await createComponent(TestHost);
    const dots = element.querySelectorAll('.step-progress__dot');
    expect(dots.length).toBe(5);
  });

  it('should render connecting lines between dots', async () => {
    const { element } = await createComponent(TestHost);
    const connectors = element.querySelectorAll('.step-progress__connector');
    expect(connectors.length).toBe(4);
  });

  it('should mark completed steps with completed class', async () => {
    const { element } = await createComponent(TestHost);
    const dots = element.querySelectorAll('.step-progress__dot');
    expect(dots[0].classList.contains('step-progress__dot--completed')).toBe(
      true,
    );
    expect(dots[1].classList.contains('step-progress__dot--completed')).toBe(
      true,
    );
    expect(dots[2].classList.contains('step-progress__dot--completed')).toBe(
      false,
    );
  });

  it('should mark current step with active class', async () => {
    const { element } = await createComponent(TestHost);
    const dots = element.querySelectorAll('.step-progress__dot');
    expect(dots[2].classList.contains('step-progress__dot--active')).toBe(true);
    // Other dots should not be active
    expect(dots[0].classList.contains('step-progress__dot--active')).toBe(
      false,
    );
    expect(dots[1].classList.contains('step-progress__dot--active')).toBe(
      false,
    );
  });

  it('should mark future steps with future class', async () => {
    const { element } = await createComponent(TestHost);
    const dots = element.querySelectorAll('.step-progress__dot');
    expect(dots[3].classList.contains('step-progress__dot--future')).toBe(true);
    expect(dots[4].classList.contains('step-progress__dot--future')).toBe(true);
  });

  it('should color completed connectors', async () => {
    const { element } = await createComponent(TestHost);
    const connectors = element.querySelectorAll('.step-progress__connector');
    // Connectors after step 1 and step 2 (both completed) should be completed
    expect(
      connectors[0].classList.contains(
        'step-progress__connector--completed',
      ),
    ).toBe(true);
    expect(
      connectors[1].classList.contains(
        'step-progress__connector--completed',
      ),
    ).toBe(true);
    // Connector after step 3 (active) should not be completed (future color per reviewer feedback)
    expect(
      connectors[2].classList.contains(
        'step-progress__connector--completed',
      ),
    ).toBe(false);
    // Connector after step 4 (future) should not be completed
    expect(
      connectors[3].classList.contains(
        'step-progress__connector--completed',
      ),
    ).toBe(false);
  });

  it('should not render step labels in compact variant', async () => {
    const { element } = await createComponent(TestHost);
    const labels = element.querySelectorAll('.step-progress__label');
    expect(labels.length).toBe(0);
  });

  it('should render step number labels in full variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'full';
    fixture.detectChanges();
    await fixture.whenStable();
    const labels = element.querySelectorAll('.step-progress__label');
    expect(labels.length).toBe(5);
    expect(labels[0].textContent?.trim()).toBe('1');
    expect(labels[1].textContent?.trim()).toBe('2');
    expect(labels[4].textContent?.trim()).toBe('5');
  });

  it('should have role=progressbar on host', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-step-progress');
    expect(host?.getAttribute('role')).toBe('progressbar');
  });

  it('should set aria-valuenow to completed step count', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-step-progress');
    expect(host?.getAttribute('aria-valuenow')).toBe('2');
  });

  it('should set aria-valuemin to 0', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-step-progress');
    expect(host?.getAttribute('aria-valuemin')).toBe('0');
  });

  it('should set aria-valuemax to totalSteps', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-step-progress');
    expect(host?.getAttribute('aria-valuemax')).toBe('5');
  });

  it('should set descriptive aria-label', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-step-progress');
    expect(host?.getAttribute('aria-label')).toBe(
      'Mission progress: step 3 of 5, 2 completed',
    );
  });

  it('should apply step-progress--compact class in compact variant', async () => {
    const { element } = await createComponent(TestHost);
    const host = element.querySelector('nx-step-progress');
    expect(host?.classList.contains('step-progress--compact')).toBe(true);
    expect(host?.classList.contains('step-progress--full')).toBe(false);
  });

  it('should apply step-progress--full class in full variant', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.variant = 'full';
    fixture.detectChanges();
    await fixture.whenStable();
    const host = element.querySelector('nx-step-progress');
    expect(host?.classList.contains('step-progress--full')).toBe(true);
    expect(host?.classList.contains('step-progress--compact')).toBe(false);
  });

  it('should render nothing when totalSteps is 0', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.totalSteps = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    const dots = element.querySelectorAll('.step-progress__dot');
    const connectors = element.querySelectorAll('.step-progress__connector');
    expect(dots.length).toBe(0);
    expect(connectors.length).toBe(0);
  });

  it('should handle completedSteps with out-of-range values', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.completedSteps = [0, 6];
    fixture.componentInstance.currentStep = 1;
    fixture.detectChanges();
    await fixture.whenStable();
    // Out-of-range values are ignored, so no dots should be completed
    const completedDots = element.querySelectorAll(
      '.step-progress__dot--completed',
    );
    expect(completedDots.length).toBe(0);
    // Component should still render 5 dots
    const dots = element.querySelectorAll('.step-progress__dot');
    expect(dots.length).toBe(5);
  });

  it('should handle duplicate completedSteps', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.completedSteps = [1, 1, 2];
    fixture.detectChanges();
    await fixture.whenStable();
    const completedDots = element.querySelectorAll(
      '.step-progress__dot--completed',
    );
    // Only 2 unique completed steps (1 and 2), not 3
    expect(completedDots.length).toBe(2);
    // Still renders 5 dots total
    const dots = element.querySelectorAll('.step-progress__dot');
    expect(dots.length).toBe(5);
  });

  it('should update when inputs change dynamically', async () => {
    const { fixture, element } = await createComponent(TestHost);

    // Initial: currentStep=3, completedSteps=[1,2]
    const activeDots = element.querySelectorAll('.step-progress__dot--active');
    expect(activeDots.length).toBe(1);
    const dots = element.querySelectorAll('.step-progress__dot');
    expect(dots[2].classList.contains('step-progress__dot--active')).toBe(true);

    // Change: currentStep=4, completedSteps=[1,2,3]
    fixture.componentInstance.currentStep = 4;
    fixture.componentInstance.completedSteps = [1, 2, 3];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const updatedDots = element.querySelectorAll('.step-progress__dot');
    // Step 3 should now be completed, step 4 should be active
    expect(
      updatedDots[2].classList.contains('step-progress__dot--completed'),
    ).toBe(true);
    expect(
      updatedDots[3].classList.contains('step-progress__dot--active'),
    ).toBe(true);

    // aria-valuenow should update
    const host = element.querySelector('nx-step-progress');
    expect(host?.getAttribute('aria-valuenow')).toBe('3');
  });
});
