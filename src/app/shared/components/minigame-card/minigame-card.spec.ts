import { Component } from '@angular/core';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent } from '../../../../testing/test-utils';
import { APP_ICONS } from '../../icons';
import { MinigameCardComponent } from './minigame-card';
import type { MinigameConfig, MinigameId } from '../../../core/minigame';
import { DifficultyTier } from '../../../core/minigame';

@Component({
  template: `
    <nx-minigame-card
      [config]="config"
      [mastery]="mastery"
      [levelsCompleted]="levelsCompleted"
      [isLocked]="locked"
      [unlockMessage]="unlockMessage"
      (cardClicked)="clickedId = $event" />
  `,
  imports: [MinigameCardComponent],
})
class TestHost {
  config: MinigameConfig = {
    id: 'module-assembly' as MinigameId,
    name: 'Module Assembly',
    description: 'Test desc',
    angularTopic: 'Components & Templates',
    totalLevels: 18,
    difficultyTiers: [
      DifficultyTier.Basic,
      DifficultyTier.Intermediate,
      DifficultyTier.Advanced,
      DifficultyTier.Boss,
    ],
  };
  mastery = 3;
  levelsCompleted = 5;
  locked = false;
  unlockMessage = '';
  clickedId: MinigameId | null = null;
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

describe('MinigameCardComponent', () => {
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
    return element.querySelector('nx-minigame-card') as HTMLElement;
  }

  it('should create the component', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host).toBeTruthy();
  });

  it('should display game name', async () => {
    const { element } = await setup();
    const name = element.querySelector('.minigame-card__name');
    expect(name).toBeTruthy();
    expect(name!.textContent).toContain('Module Assembly');
  });

  it('should display Angular topic', async () => {
    const { element } = await setup();
    const topic = element.querySelector('.minigame-card__topic');
    expect(topic).toBeTruthy();
    expect(topic!.textContent).toContain('Components & Templates');
  });

  it('should render MasteryStarsComponent with correct star count', async () => {
    const { element } = await setup({ mastery: 4 });
    const stars = element.querySelector('nx-mastery-stars');
    expect(stars).toBeTruthy();
    const filled = element.querySelectorAll('.mastery-stars__star--filled');
    expect(filled.length).toBe(4);
  });

  it('should display completion fraction', async () => {
    const { element } = await setup();
    const stats = element.querySelector('.minigame-card__stats');
    expect(stats).toBeTruthy();
    expect(stats!.textContent).toContain('5/18 levels');
  });

  it('should display "0/18 levels" when no levels completed', async () => {
    const { element } = await setup({ levelsCompleted: 0 });
    const stats = element.querySelector('.minigame-card__stats');
    expect(stats).toBeTruthy();
    expect(stats!.textContent).toContain('0/18 levels');
  });

  it('should emit cardClicked with gameId on click', async () => {
    const { fixture, element } = await setup();
    const host = getHost(element);
    host.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clickedId).toBe('module-assembly');
  });

  it('should not emit cardClicked when locked', async () => {
    const { fixture, element } = await setup({ locked: true });
    const host = getHost(element);
    host.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clickedId).toBeNull();
  });

  it('should render LockedContentComponent overlay when locked', async () => {
    const { element } = await setup({ locked: true });
    const overlay = element.querySelector(
      'nx-locked-content .locked-content__overlay',
    );
    expect(overlay).toBeTruthy();
  });

  it('should not render locked overlay when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const overlay = element.querySelector('.locked-content__overlay');
    expect(overlay).toBeNull();
  });

  it('should apply unlocked class for hover glow when unlocked', async () => {
    const { element } = await setup({ locked: false });
    const host = getHost(element);
    expect(host.classList.contains('minigame-card--unlocked')).toBe(true);
  });

  it('should not apply unlocked class when locked', async () => {
    const { element } = await setup({ locked: true });
    const host = getHost(element);
    expect(host.classList.contains('minigame-card--unlocked')).toBe(false);
  });

  it('should set aria-label with game name and topic', async () => {
    const { element } = await setup();
    const host = getHost(element);
    expect(host.getAttribute('aria-label')).toContain('Module Assembly');
    expect(host.getAttribute('aria-label')).toContain('Components & Templates');
  });

  it('should set aria-disabled when locked', async () => {
    const { element } = await setup({ locked: true });
    const host = getHost(element);
    expect(host.getAttribute('aria-disabled')).toBe('true');
  });

  it('should pass unlockMessage to LockedContentComponent', async () => {
    const { element } = await setup({
      locked: true,
      unlockMessage: 'Complete mission: First Steps',
    });
    const message = element.querySelector(
      'nx-locked-content .locked-content__message',
    );
    expect(message).toBeTruthy();
    expect(message!.textContent).toContain('Complete mission: First Steps');
  });
});
