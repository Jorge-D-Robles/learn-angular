import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_09_CONTENT: StoryMissionContent = {
  chapterId: 9,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station is running low on power. The Star Chart module, Crew Database, and Research Archive ' +
        'are massive — loading them all at startup drains the power reserves. Deferrable views let you delay ' +
        'rendering heavy components until they are actually needed, saving critical resources.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use @defer to delay rendering of a component until a trigger fires. The @placeholder shows ' +
        'while waiting, @loading during load, and @error if something fails.',
      code: [
        '@Component({',
        "  selector: 'app-station-dashboard',",
        '  imports: [StarChartComponent, SpinnerComponent],',
        '  template: `',
        '    <h2>Station Dashboard</h2>',
        '',
        '    @defer (on viewport) {',
        '      <app-star-chart />',
        '    } @placeholder {',
        '      <p>Star chart will load when scrolled into view</p>',
        '    } @loading {',
        '      <app-spinner />',
        '    } @error {',
        '      <p>Failed to load star chart module</p>',
        '    }',
        '',
        '    @defer (on interaction) {',
        '      <app-crew-database />',
        '    } @placeholder {',
        '      <button>Click to load Crew Database</button>',
        '    }',
        '',
        '    @defer (on timer(2s)) {',
        '      <app-research-archive />',
        '    } @placeholder {',
        '      <p>Research archive loading in 2 seconds...</p>',
        '    }',
        '  `,',
        '})',
        'export class StationDashboardComponent {}',
      ].join('\n'),
      language: 'angular-template',
      highlightLines: [7, 9, 11, 13, 17, 23],
      explanation:
        '@defer delays rendering until a trigger fires. Triggers include: on viewport (element scrolls into view), ' +
        'on interaction (user clicks/hovers), on timer(Ns) (after a delay), on idle (browser is idle), and ' +
        'when condition (expression becomes true). Each @defer block can have @placeholder, @loading, and @error states.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Heavy modules now load on demand, keeping the station\'s power consumption lean until components are needed.',
      conceptTitle: 'Deferrable Views -- @defer',
      conceptBody:
        'Deferrable views let you lazy-render components and their dependencies. The @defer block delays ' +
        'rendering until a trigger fires, reducing initial bundle size and render time. Four companion blocks ' +
        'handle loading states: @placeholder (before trigger), @loading (during load), @error (on failure).',
      keyPoints: [
        'Triggers: on viewport, on interaction, on idle, on timer(Ns), when expression',
        '@placeholder, @loading, and @error provide UI for each loading state',
        'Reduces initial bundle size — deferred components are lazy-loaded automatically',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The station dashboard is overloaded. Write deferrable views that delay rendering heavy modules ' +
        'until they are needed, with placeholder and loading states.',
      starterCode: [
        '<!-- Available components: <app-star-chart />, <app-spinner /> -->',
        '',
        '<!-- TODO: Wrap the star chart in a deferred view that loads lazily -->',
        '<!-- Include a placeholder and loading state -->',
        '<app-star-chart />',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'contains',
          value: '@defer',
          errorMessage: 'Use a deferrable view to delay rendering the component',
        },
        {
          type: 'pattern',
          pattern: 'on\\s+(viewport|interaction|idle|timer|hover)',
          errorMessage: 'Add a trigger to the deferred view (viewport, interaction, idle, timer, or hover)',
        },
        {
          type: 'contains',
          value: '@placeholder',
          errorMessage: 'Add a placeholder block that shows before the trigger fires',
        },
        {
          type: 'pattern',
          pattern: '@(loading|error)',
          errorMessage: 'Add a loading or error companion block for loading states',
        },
        {
          type: 'notContains',
          value: '*ngIf',
          errorMessage: 'Use @defer for lazy rendering instead of *ngIf',
        },
      ],
      hints: [
        'Wrap content in @defer (on viewport) { ... } to delay rendering until scrolled into view',
        'Add @placeholder { ... } and @loading { ... } blocks after the main content',
      ],
      successMessage:
        'Heavy modules now load on demand! The dashboard conserves power by deferring rendering.',
      explanation:
        '@defer delays rendering until a trigger fires (viewport, interaction, idle, timer). Companion ' +
        'blocks @placeholder, @loading, and @error provide UI for each loading state.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Heavy modules now load on demand!',
    minStepsViewed: 4,
  },
};
