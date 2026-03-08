import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { ScoreBreakdownComponent } from './score-breakdown';
import { ScoreBreakdownItem } from './score-breakdown.types';

@Component({
  template: `<nx-score-breakdown [breakdown]="breakdown" />`,
  imports: [ScoreBreakdownComponent],
})
class TestHost {
  breakdown: ScoreBreakdownItem[] = [];
}

describe('ScoreBreakdownComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHost(element: HTMLElement): HTMLElement {
    return element.querySelector('nx-score-breakdown') as HTMLElement;
  }

  function getRows(element: HTMLElement): HTMLElement[] {
    const host = getHost(element);
    return Array.from(host.querySelectorAll('.score-breakdown__row'));
  }

  function getTotal(element: HTMLElement): HTMLElement {
    const host = getHost(element);
    return host.querySelector('.score-breakdown__total') as HTMLElement;
  }

  // --- Creation ---

  it('should create the component with empty breakdown', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // --- Row Rendering ---

  it('should render a row for each breakdown item', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 100, isBonus: false },
      { label: 'Time Bonus', value: 50, isBonus: true },
      { label: 'Hint Penalty', value: -25, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    expect(getRows(element).length).toBe(3);
  });

  // --- Label Display ---

  it('should display the correct label for each row', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 100, isBonus: false },
      { label: 'Time Bonus', value: 50, isBonus: true },
    ];
    const { element } = await setup({ breakdown });
    const rows = getRows(element);
    const labels = rows.map(
      (row) => row.querySelector('.score-breakdown__label')!.textContent!.trim(),
    );
    expect(labels).toEqual(['Base Score', 'Time Bonus']);
  });

  // --- Value Display ---

  it('should display positive values with + prefix', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 100, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    const value = getRows(element)[0].querySelector('.score-breakdown__value');
    expect(value!.textContent!.trim()).toBe('+100');
  });

  it('should display negative values with inherent minus sign', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Hint Penalty', value: -25, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    const value = getRows(element)[0].querySelector('.score-breakdown__value');
    expect(value!.textContent!.trim()).toBe('-25');
  });

  // --- Bonus Styling ---

  it('should apply bonus class to items with isBonus true', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Time Bonus', value: 50, isBonus: true },
    ];
    const { element } = await setup({ breakdown });
    const row = getRows(element)[0];
    expect(row.classList.contains('score-breakdown__row--bonus')).toBe(true);
    expect(row.classList.contains('score-breakdown__row--penalty')).toBe(false);
  });

  // --- Penalty Styling ---

  it('should apply penalty class to non-bonus items with negative value', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Hint Penalty', value: -25, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    const row = getRows(element)[0];
    expect(row.classList.contains('score-breakdown__row--penalty')).toBe(true);
    expect(row.classList.contains('score-breakdown__row--bonus')).toBe(false);
  });

  // --- Base Item Styling ---

  it('should not apply bonus or penalty class to base items', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 100, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    const row = getRows(element)[0];
    expect(row.classList.contains('score-breakdown__row--bonus')).toBe(false);
    expect(row.classList.contains('score-breakdown__row--penalty')).toBe(false);
  });

  // --- Total Calculation ---

  it('should display the sum of all values in the total row', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 100, isBonus: false },
      { label: 'Time Bonus', value: 50, isBonus: true },
      { label: 'Hint Penalty', value: -25, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    const total = getTotal(element);
    const value = total.querySelector('.score-breakdown__value');
    expect(value!.textContent!.trim()).toBe('+125');
  });

  it('should display 0 in total row when breakdown is empty', async () => {
    const { element } = await setup({ breakdown: [] });
    const total = getTotal(element);
    const value = total.querySelector('.score-breakdown__value');
    expect(value!.textContent!.trim()).toBe('0');
  });

  // --- New Best Indicator ---

  it('should render New Best badge when isNew is true', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Time Bonus', value: 50, isBonus: true, isNew: true },
    ];
    const { element } = await setup({ breakdown });
    const row = getRows(element)[0];
    const badge = row.querySelector('.score-breakdown__new-best');
    expect(badge).toBeTruthy();
    expect(badge!.textContent!.trim()).toBe('New Best!');
  });

  it('should not render New Best badge when isNew is false', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 100, isBonus: false, isNew: false },
    ];
    const { element } = await setup({ breakdown });
    const row = getRows(element)[0];
    const badge = row.querySelector('.score-breakdown__new-best');
    expect(badge).toBeNull();
  });

  it('should not render New Best badge when isNew is undefined', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 100, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    const row = getRows(element)[0];
    const badge = row.querySelector('.score-breakdown__new-best');
    expect(badge).toBeNull();
  });

  // --- Accessibility ---

  it('should have role="table" on host element', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('table');
  });

  it('should have aria-label "Score breakdown" on host element', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe('Score breakdown');
  });

  // --- Mixed Scenario ---

  it('should handle a mixed breakdown with correct classes and total', async () => {
    const breakdown: ScoreBreakdownItem[] = [
      { label: 'Base Score', value: 200, isBonus: false },
      { label: 'Time Bonus', value: 75, isBonus: true, isNew: true },
      { label: 'Accuracy Bonus', value: 50, isBonus: true },
      { label: 'Hint Penalty', value: -30, isBonus: false },
    ];
    const { element } = await setup({ breakdown });
    const rows = getRows(element);
    expect(rows.length).toBe(4);

    // Base item
    expect(rows[0].classList.contains('score-breakdown__row--bonus')).toBe(false);
    expect(rows[0].classList.contains('score-breakdown__row--penalty')).toBe(false);

    // Bonus items
    expect(rows[1].classList.contains('score-breakdown__row--bonus')).toBe(true);
    expect(rows[2].classList.contains('score-breakdown__row--bonus')).toBe(true);

    // Penalty item
    expect(rows[3].classList.contains('score-breakdown__row--penalty')).toBe(true);

    // New Best badge only on time bonus
    expect(rows[1].querySelector('.score-breakdown__new-best')).toBeTruthy();
    expect(rows[0].querySelector('.score-breakdown__new-best')).toBeNull();
    expect(rows[2].querySelector('.score-breakdown__new-best')).toBeNull();
    expect(rows[3].querySelector('.score-breakdown__new-best')).toBeNull();

    // Total = 200 + 75 + 50 - 30 = 295
    const total = getTotal(element);
    const totalValue = total.querySelector('.score-breakdown__value');
    expect(totalValue!.textContent!.trim()).toBe('+295');
  });
});
