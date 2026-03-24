import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_34_CONTENT: StoryMissionContent = {
  chapterId: 34,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station is fully operational, but deep space conditions push systems to their limits. ' +
        'Modules re-render too often, large subsystems load upfront slowing the initial boot, and ' +
        'long lists of sensor readings cause scroll lag. Station hardening means optimizing performance — ' +
        'reducing unnecessary change detection cycles, lazy loading module bundles, and efficiently ' +
        'tracking list items to minimize DOM churn.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use ChangeDetectionStrategy.OnPush to skip change detection for a component unless its ' +
        'inputs change or a signal it reads updates.',
      code: [
        "import { Component, ChangeDetectionStrategy, input } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-sensor-card',",
        '  template: `',
        '    <div class="card">',
        '      <h3>{{ name() }}</h3>',
        '      <p>{{ reading() }} {{ unit() }}</p>',
        '    </div>',
        '  `,',
        '  changeDetection: ChangeDetectionStrategy.OnPush,',
        '})',
        'export class SensorCardComponent {',
        '  name = input.required<string>();',
        '  reading = input.required<number>();',
        "  unit = input('K');",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 11],
      explanation:
        'ChangeDetectionStrategy.OnPush tells Angular to skip change detection for this component ' +
        'unless one of its input references changes, a signal it reads updates, or an event handler ' +
        'fires within the component. This dramatically reduces unnecessary re-renders in large ' +
        'component trees — especially for display-only components like cards and list items.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use track in @for loops to help Angular identify which items changed, and lazy load routes ' +
        'to defer loading large module bundles until they are navigated to.',
      code: [
        "import { Component, signal } from '@angular/core';",
        "import { Routes } from '@angular/router';",
        '',
        '// Efficient list rendering with track:',
        '@Component({',
        "  selector: 'app-sensor-list',",
        '  template: `',
        '    @for (sensor of sensors(); track sensor.id) {',
        '      <app-sensor-card',
        '        [name]="sensor.name"',
        '        [reading]="sensor.value" />',
        '    }',
        '  `,',
        '})',
        'export class SensorListComponent {',
        '  sensors = signal([',
        "    { id: 1, name: 'Thermal', value: 294.1 },",
        "    { id: 2, name: 'Pressure', value: 101.3 },",
        '  ]);',
        '}',
        '',
        '// Lazy loading routes:',
        'export const routes: Routes = [',
        '  {',
        "    path: 'reactor',",
        "    loadComponent: () => import('./reactor/reactor').then(m => m.ReactorComponent),",
        '  },',
        '  {',
        "    path: 'comms',",
        "    loadComponent: () => import('./comms/comms').then(m => m.CommsComponent),",
        '  },',
        '];',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [8, 23, 25, 30],
      explanation:
        'The track expression in @for tells Angular how to identify each item across re-renders. ' +
        'Tracking by a unique ID (sensor.id) lets Angular reuse DOM nodes instead of recreating them. ' +
        'Lazy loading with loadComponent defers the JavaScript bundle until the route is visited, ' +
        'reducing the initial boot time. Together, these techniques keep the station responsive ' +
        'under load.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Station hardened for deep space. Here are the key Angular performance optimization techniques.',
      conceptTitle: 'Performance — OnPush, track, and Lazy Loading',
      conceptBody:
        'OnPush change detection skips unnecessary re-renders by only checking components when inputs ' +
        'change or signals update. The track expression in @for helps Angular efficiently reuse DOM ' +
        'elements during list updates. Lazy loading with loadComponent defers route bundles until ' +
        'navigation, reducing initial load time. Combine all three for optimal performance.',
      keyPoints: [
        'ChangeDetectionStrategy.OnPush reduces unnecessary change detection cycles',
        'track in @for identifies items for efficient DOM reuse across re-renders',
        'loadComponent lazy loads route components to reduce initial bundle size',
        'Combine OnPush, track, and lazy loading for maximum performance',
      ],
    },
  ],
  completionCriteria: {
    description: 'Station hardened for deep space!',
    minStepsViewed: 4,
  },
};
