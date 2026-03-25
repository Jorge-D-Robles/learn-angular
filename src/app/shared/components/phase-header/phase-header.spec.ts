import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { PhaseHeaderComponent } from './phase-header';

@Component({
  template: `
    <nx-phase-header
      [phaseNumber]="phaseNumber"
      [phaseName]="phaseName"
      [phaseDescription]="phaseDescription"
      [completedCount]="completedCount"
      [totalCount]="totalCount">
      <div class="test-content">Projected</div>
    </nx-phase-header>
  `,
  imports: [PhaseHeaderComponent],
})
class TestHost {
  phaseNumber = 1;
  phaseName = 'Foundations';
  phaseDescription = 'Rebuild the station core';
  completedCount = 7;
  totalCount = 10;
}

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

describe('PhaseHeaderComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      providers: ICON_PROVIDERS,
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getHost(element: HTMLElement): HTMLElement {
    return element.querySelector('nx-phase-header') as HTMLElement;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host).toBeTruthy();
  });

  it('should display phase number in badge', async () => {
    const { element } = await setup({ phaseNumber: 3 });
    const badge = element.querySelector('.phase-header__badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent!.trim()).toBe('3');
  });

  it('should display phase name with phase number', async () => {
    const { element } = await setup({ phaseNumber: 2, phaseName: 'Navigation' });
    const name = element.querySelector('.phase-header__name');
    expect(name).toBeTruthy();
    expect(name!.textContent).toContain('Phase 2: Navigation');
  });

  it('should display phase description', async () => {
    const { element } = await setup({ phaseDescription: 'Rebuild corridors' });
    const desc = element.querySelector('.phase-header__description');
    expect(desc).toBeTruthy();
    expect(desc!.textContent).toContain('Rebuild corridors');
  });

  it('should display progress fraction', async () => {
    const { element } = await setup({ completedCount: 7, totalCount: 10 });
    const progress = element.querySelector('.phase-header__progress');
    expect(progress).toBeTruthy();
    expect(progress!.textContent!.trim()).toBe('7/10');
  });

  it('should show body content by default (expanded)', async () => {
    const { element } = await setup();
    const body = element.querySelector('.phase-header__body');
    expect(body).toBeTruthy();
  });

  it('should project content into the body', async () => {
    const { element } = await setup();
    const projected = element.querySelector('.phase-header__body .test-content');
    expect(projected).toBeTruthy();
    expect(projected!.textContent).toContain('Projected');
  });

  it('should collapse body on toggle click', async () => {
    const { fixture, element } = await setup();
    const toggle = element.querySelector('.phase-header__toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const body = element.querySelector('.phase-header__body');
    expect(body).toBeNull();
  });

  it('should re-expand body on second toggle click', async () => {
    const { fixture, element } = await setup();
    const toggle = element.querySelector('.phase-header__toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const body = element.querySelector('.phase-header__body');
    expect(body).toBeTruthy();
  });

  it('should set aria-expanded to true by default', async () => {
    const { element } = await setup();
    const toggle = element.querySelector('.phase-header__toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('should set aria-expanded to false after collapse', async () => {
    const { fixture, element } = await setup();
    const toggle = element.querySelector('.phase-header__toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('should set aria-label on host with phase info and progress', async () => {
    const { element } = await setup({
      phaseNumber: 1,
      phaseName: 'Foundations',
      completedCount: 7,
      totalCount: 10,
    });
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toBe(
      'Phase 1: Foundations, 7 of 10 completed',
    );
  });

  it('should handle zero progress gracefully', async () => {
    const { element } = await setup({ completedCount: 0, totalCount: 0 });
    const progress = element.querySelector('.phase-header__progress');
    expect(progress).toBeTruthy();
    expect(progress!.textContent!.trim()).toBe('0/0');
  });

  it('should show chevron-up icon when expanded', async () => {
    const { fixture } = await setup();
    const iconDebug = fixture.debugElement.query(
      (el) => el.nativeElement.classList.contains('phase-header__chevron'),
    );
    expect(iconDebug).toBeTruthy();
    expect(iconDebug.componentInstance.name).toBe('chevron-up');
  });

  it('should show chevron-down icon when collapsed', async () => {
    const { fixture, element } = await setup();
    const toggle = element.querySelector('.phase-header__toggle') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const iconDebug = fixture.debugElement.query(
      (el) => el.nativeElement.classList.contains('phase-header__chevron'),
    );
    expect(iconDebug).toBeTruthy();
    expect(iconDebug.componentInstance.name).toBe('chevron-down');
  });

  it('should have role=group on host', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('role')).toBe('group');
  });

  it('should handle empty description gracefully', async () => {
    const { element } = await setup({ phaseDescription: '' });
    const desc = element.querySelector('.phase-header__description');
    expect(desc).toBeTruthy();
    expect(desc!.textContent!.trim()).toBe('');
  });
});
