import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_09_CONTENT: StoryMissionContent = {
  chapterId: 9,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Every component you\'ve built so far loads immediately when the page loads. For a small app, that\'s ' +
        'fine. But imagine Nexus Station with 50 modules. Loading them all upfront would be like opening every ' +
        'app on your phone at once. The Star Chart, Crew Database, and Research Archive are massive. Deferrable ' +
        'views let you say "don\'t load this until it\'s actually needed."',
    },
    {
      stepType: 'code-example',
      narrativeText:
        '@defer is surprisingly simple for what it does. You wrap a component, pick a trigger (when should it ' +
        'load?), and optionally define what to show while waiting. Angular handles the rest: code splitting, ' +
        'lazy loading, the whole pipeline.',
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
        'Each @defer block has a trigger that answers "when should this load?" on viewport means "when the ' +
        'user scrolls it into view." on interaction means "when the user clicks or hovers." on timer(2s) means ' +
        '"after 2 seconds." The companion blocks handle the in-between states: @placeholder shows before the ' +
        'trigger fires, @loading shows while the code is being fetched, and @error catches failures.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Heavy modules now load on demand. The initial page load stays fast because the browser only downloads ' +
        'what\'s immediately visible. Everything else waits for its trigger.',
      conceptTitle: 'Deferrable Views with @defer',
      conceptBody:
        'Here\'s the real win: @defer doesn\'t just delay rendering. It splits the deferred component into a ' +
        'separate JavaScript chunk automatically. That means the browser doesn\'t even download the code until ' +
        'the trigger fires. For large apps, this can cut your initial bundle size dramatically.',
      keyPoints: [
        'Five triggers: on viewport (scrolled into view), on interaction (click/hover), on idle (browser has nothing else to do), on timer(Ns) (after a delay), when expression (a condition becomes true)',
        '@placeholder, @loading, and @error give you control over what the user sees during each phase, so there are no blank gaps or mystery spinners',
        'Angular handles the code splitting behind the scenes, so you don\'t need to configure webpack or write dynamic imports yourself',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The station dashboard is trying to load everything at once and it\'s choking. Wrap the star chart ' +
        'in a @defer block so it loads lazily, and give it placeholder and loading states so the UI doesn\'t ' +
        'just show a blank gap.',
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
        '@defer (on viewport) { <app-star-chart /> } wraps the component. Pick whichever trigger makes sense for your use case',
        'Add @placeholder { ... } right after the closing brace to define what shows before the trigger fires, then @loading { ... } for the loading state',
      ],
      successMessage:
        'The dashboard breathes easier now. Deferred views keep the initial load fast by only fetching ' +
        'heavy components when they\'re actually needed. One more chapter in this phase: image optimization, ' +
        'which is more practical than it sounds.',
      explanation:
        '@defer delays both rendering AND downloading. The component\'s code isn\'t even fetched until the ' +
        'trigger fires. @placeholder shows before that happens, @loading shows during the download, and ' +
        '@error catches anything that goes wrong. Pick the trigger that matches your UX intent.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Heavy modules now load on demand!',
    minStepsViewed: 4,
  },
};
