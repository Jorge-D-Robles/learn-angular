import { Component, computed, input, output } from '@angular/core';
import type { MinigameId } from '../../../core/minigame/minigame.types';

interface StationModule {
  readonly id: MinigameId;
  readonly name: string;
}

/** Static list of the 12 station modules. Names copied from DEFAULT_MINIGAME_CONFIGS. */
const STATION_MODULES: readonly StationModule[] = [
  { id: 'module-assembly', name: 'Module Assembly' },
  { id: 'wire-protocol', name: 'Wire Protocol' },
  { id: 'flow-commander', name: 'Flow Commander' },
  { id: 'signal-corps', name: 'Signal Corps' },
  { id: 'corridor-runner', name: 'Corridor Runner' },
  { id: 'terminal-hack', name: 'Terminal Hack' },
  { id: 'power-grid', name: 'Power Grid' },
  { id: 'data-relay', name: 'Data Relay' },
  { id: 'reactor-core', name: 'Reactor Core' },
  { id: 'deep-space-radio', name: 'Deep Space Radio' },
  { id: 'system-certification', name: 'System Certification' },
  { id: 'blast-doors', name: 'Blast Doors' },
];

interface ModuleNode {
  readonly id: MinigameId;
  readonly name: string;
  readonly mastery: number;
  readonly glowColor: string | null;
  readonly isDark: boolean;
  readonly isPulse: boolean;
  readonly ariaLabel: string;
}

@Component({
  selector: 'nx-station-visualization',
  template: `
    <div class="station-viz__grid">
      @for (node of moduleNodes(); track node.id) {
        <button
          class="station-viz__node"
          [class.station-viz__node--dark]="node.isDark"
          [class.station-viz__node--pulse]="node.isPulse"
          [style.--module-glow]="node.glowColor"
          [attr.data-game-id]="node.id"
          [attr.aria-label]="node.ariaLabel"
          (click)="moduleClicked.emit(node.id)">
          <span class="station-viz__node-name">{{ node.name }}</span>
          <span class="station-viz__node-mastery">{{ node.mastery }} ★</span>
        </button>
      }
    </div>
  `,
  styleUrl: './station-visualization.scss',
  host: {
    'class': 'station-viz',
  },
})
export class StationVisualizationComponent {
  readonly masteryData = input<Map<string, number>>(new Map());
  readonly moduleClicked = output<MinigameId>();

  readonly moduleNodes = computed<ModuleNode[]>(() => {
    const data = this.masteryData();
    return STATION_MODULES.map((mod) => {
      const raw = data.get(mod.id) ?? 0;
      const mastery = Math.min(5, Math.max(0, raw));
      return {
        id: mod.id,
        name: mod.name,
        mastery,
        glowColor: mastery === 0 ? null : `var(--nx-mastery-${mastery})`,
        isDark: mastery === 0,
        isPulse: mastery === 5,
        ariaLabel: `${mod.name} - ${mastery} stars mastery`,
      };
    });
  });
}
