import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_34_CONTENT: StoryMissionContent = {
  chapterId: 34,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'This is the capstone chapter. Everything works. Now make it fast. Performance optimization is ' +
        'like tuning a car engine after you have built the whole car. You don\'t start here, you end here. ' +
        'You\'ll revisit concepts from earlier: @for loops need track (Chapter 4), components can opt into ' +
        'OnPush change detection, and routes can lazy-load (Chapter 11). It all comes together in this chapter.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'By default, Angular checks every component in the tree whenever anything changes: a click, ' +
        'a timer, an HTTP response. OnPush tells Angular: "Only check this component when its inputs ' +
        'change or a signal it reads updates." For display-only components, this is a massive win.',
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
        'OnPush changes the deal: Angular only re-checks this component when an input reference changes, ' +
        'a signal it reads emits a new value, or an event fires within the component itself. Everything ' +
        'else (timers in parent components, unrelated HTTP calls) gets ignored. For a card component ' +
        'like this one that just displays data, OnPush eliminates dozens of unnecessary checks per cycle.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Two more techniques that compound with OnPush. Track expressions in @for loops tell Angular ' +
        'how to identify items so it can reuse DOM nodes instead of destroying and recreating them. ' +
        'Lazy loading defers entire route bundles until the user actually navigates there, shrinking ' +
        'your initial load.',
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
        'Without track, Angular has to destroy and recreate every DOM node when the list changes. ' +
        'With track sensor.id, it matches items across renders by their ID and only updates ' +
        'what actually changed. Lazy loading with loadComponent works the same way as lazy routes ' +
        'from Chapter 11, so the JavaScript for /reactor doesn\'t load until someone navigates there. ' +
        'Your initial bundle stays small, and users only download what they use.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'You have built the whole station and hardened it for production. OnPush, track, and lazy loading ' +
        'are the three performance tools you will reach for most often in real Angular apps.',
      conceptTitle: 'Performance: OnPush, Track, and Lazy Loading',
      conceptBody:
        'These three techniques target different bottlenecks. OnPush reduces change detection work by ' +
        'skipping components whose inputs haven\'t changed. Track in @for reduces DOM work by reusing ' +
        'nodes across list updates. Lazy loading reduces network work by splitting your app into ' +
        'chunks loaded on demand. Each one is simple on its own. Combined, they keep large apps snappy.',
      keyPoints: [
        'OnPush is the single biggest performance win for component-heavy apps because it turns O(n) change detection into O(changed)',
        'Track expressions prevent DOM thrashing: Angular reuses existing elements instead of recreating the entire list',
        'Lazy loading is free performance. Routes the user hasn\'t visited don\'t cost anything until they navigate there',
        'Profile first, optimize second. These techniques matter most in apps with large component trees, long lists, or heavy initial bundles',
      ],
    },
  ],
  completionCriteria: {
    description: 'Station hardened for deep space!',
    minStepsViewed: 4,
  },
};
