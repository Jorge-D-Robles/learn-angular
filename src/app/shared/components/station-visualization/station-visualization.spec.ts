import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { StationVisualizationComponent } from './station-visualization';
import type { MinigameId } from '../../../core/minigame/minigame.types';

@Component({
  template: `<nx-station-visualization
    [masteryData]="masteryData"
    (moduleClicked)="onModuleClicked($event)" />`,
  imports: [StationVisualizationComponent],
})
class TestHost {
  masteryData = new Map<string, number>();
  clickedModule: MinigameId | null = null;

  onModuleClicked(id: MinigameId): void {
    this.clickedModule = id;
  }
}

describe('StationVisualizationComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  function getNodes(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(
      element.querySelectorAll<HTMLButtonElement>('.station-viz__node'),
    );
  }

  function getNodeByGameId(
    element: HTMLElement,
    gameId: string,
  ): HTMLButtonElement | undefined {
    return getNodes(element).find(
      (node) => node.dataset['gameId'] === gameId,
    );
  }

  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should render 12 module nodes', async () => {
    const { element } = await setup();
    const nodes = getNodes(element);
    expect(nodes.length).toBe(12);
  });

  it('should display topic name on each module node', async () => {
    const { element } = await setup();
    const node = getNodeByGameId(element, 'module-assembly');
    const name = node?.querySelector('.station-viz__node-name');
    expect(name?.textContent?.trim()).toBe('Module Assembly');
  });

  it('should display mastery level on each module node', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 3],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly');
    const level = node?.querySelector('.station-viz__node-mastery');
    expect(level?.textContent?.trim()).toContain('3');
  });

  it('should apply dark state class for mastery 0', async () => {
    const { element } = await setup();
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.classList.contains('station-viz__node--dark')).toBe(true);
    expect(node.style.getPropertyValue('--module-glow')).toBe('');
  });

  it('should apply glow color var(--nx-mastery-1) for mastery 1', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 1],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-1)',
    );
  });

  it('should apply glow color var(--nx-mastery-2) for mastery 2', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 2],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-2)',
    );
  });

  it('should apply glow color var(--nx-mastery-3) for mastery 3', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 3],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-3)',
    );
  });

  it('should apply glow color var(--nx-mastery-4) for mastery 4', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 4],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-4)',
    );
  });

  it('should apply glow color var(--nx-mastery-5) for mastery 5', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 5],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-5)',
    );
  });

  it('should apply pulse class only for mastery 5', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 5],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.classList.contains('station-viz__node--pulse')).toBe(true);
  });

  it('should not apply pulse class for mastery 4', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 4],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.classList.contains('station-viz__node--pulse')).toBe(false);
  });

  it('should emit moduleClicked with topicId on click', async () => {
    const { fixture, element } = await setup();
    const node = getNodeByGameId(element, 'wire-protocol')!;
    node.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clickedModule).toBe('wire-protocol');
  });

  it('should default mastery to 0 for topics not in masteryData', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 3],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'wire-protocol')!;
    expect(node.classList.contains('station-viz__node--dark')).toBe(true);
  });

  it('should clamp mastery above 5 to 5', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 7],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-5)',
    );
    expect(node.classList.contains('station-viz__node--pulse')).toBe(true);
  });

  it('should clamp mastery below 0 to 0', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', -1],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.classList.contains('station-viz__node--dark')).toBe(true);
  });

  it('should update glow when masteryData changes', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 2],
    ]);
    const { fixture, element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-2)',
    );

    // Assign a NEW Map instance (signal referential equality)
    fixture.componentInstance.masteryData = new Map<string, number>([
      ['module-assembly', 4],
    ]);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const updatedNode = getNodeByGameId(element, 'module-assembly')!;
    expect(updatedNode.style.getPropertyValue('--module-glow').trim()).toBe(
      'var(--nx-mastery-4)',
    );
  });

  it('should have accessible button role for each module node', async () => {
    const { element } = await setup();
    const nodes = getNodes(element);
    for (const node of nodes) {
      expect(node.tagName).toBe('BUTTON');
    }
  });

  it('should have aria-label on each module node', async () => {
    const masteryData = new Map<string, number>([
      ['module-assembly', 3],
    ]);
    const { element } = await setup({ masteryData });
    const node = getNodeByGameId(element, 'module-assembly')!;
    expect(node.getAttribute('aria-label')).toBe(
      'Module Assembly - 3 stars mastery',
    );
  });
});
