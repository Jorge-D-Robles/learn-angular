import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_12_CONTENT: StoryMissionContent = {
  chapterId: 12,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Chapter 11 set up static routes -- /bridge always shows the bridge, /engine-room always shows ' +
        'the engine room. But what about a page that changes based on the URL? Think /module/alpha-7 ' +
        'vs /module/beta-3 -- same layout, different data. That\'s what route parameters solve. And ' +
        'while we\'re at it, what happens when someone visits a URL that doesn\'t exist? Redirects ' +
        'and wildcard routes handle those edge cases.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'A colon in a route path creates a dynamic segment. Instead of hardcoding /module/alpha-7 as ' +
        'its own route, :id captures whatever value appears in that position. The component receives ' +
        'it as a signal input -- no manual subscription needed.',
      code: [
        'export const routes: Routes = [',
        "  { path: 'module/:id', component: ModuleDetailComponent },",
        '];',
        '',
        '// With input binding enabled:',
        'provideRouter(routes, withComponentInputBinding())',
        '',
        '@Component({ ... })',
        'export class ModuleDetailComponent {',
        '  id = input.required<string>();',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 10],
      explanation:
        ':id is a placeholder, not a literal string. When someone visits /module/alpha-7, Angular ' +
        'captures "alpha-7" and delivers it to the component. withComponentInputBinding makes this ' +
        'automatic -- the route param name matches the input name, and Angular wires them together.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'What should happen when someone visits the root URL with no path? Or types a URL that doesn\'t ' +
        'match any route? Redirects handle the first case, and the wildcard route catches everything else.',
      code: [
        'export const routes: Routes = [',
        "  { path: '', redirectTo: 'bridge', pathMatch: 'full' },",
        "  { path: 'bridge', component: BridgeComponent },",
        "  { path: 'module/:id', component: ModuleDetailComponent },",
        "  { path: '**', component: HullBreachComponent },",
        '];',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 5],
      explanation:
        'The empty-path redirect sends visitors to /bridge when they hit the root URL. The ** wildcard ' +
        'at the bottom catches anything that didn\'t match above -- your 404 page. Order matters here: ' +
        'Angular checks routes top to bottom and stops at the first match.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Some sections of an app have their own internal navigation. The engineering deck might have ' +
        'sub-pages for reactor controls and shield management. Child routes let you nest a second ' +
        'router-outlet inside a parent layout.',
      code: [
        'export const routes: Routes = [',
        '  {',
        "    path: 'engineering',",
        '    component: EngineeringLayoutComponent,',
        '    children: [',
        "      { path: 'reactor', component: ReactorComponent },",
        "      { path: 'shields', component: ShieldsComponent },",
        '    ],',
        '  },',
        '];',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [5, 6, 7],
      explanation:
        'Child routes render inside the parent component\'s own router-outlet, not the app-level one. ' +
        'So /engineering/reactor shows EngineeringLayoutComponent with ReactorComponent nested inside ' +
        'it. This is how you build sections with their own internal navigation.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Route configuration is really just an ordered list of "if the URL looks like X, show Y." ' +
        'The subtlety is in the ordering and the special cases.',
      conceptTitle: 'Route Configuration -- Params, Redirects, and Wildcards',
      conceptBody:
        'Angular checks routes from top to bottom, stopping at the first match. Specific routes go ' +
        'first, the wildcard goes last. Getting this order wrong is one of the most common routing ' +
        'bugs -- a wildcard placed too early swallows routes that should have matched.',
      keyPoints: [
        ':param segments capture URL values dynamically -- one route handles infinite variations',
        'redirectTo needs pathMatch to tell Angular whether to match the full URL or just a prefix',
        'The ** wildcard is your safety net for typos and broken links -- always the last route in the array',
        'Child routes create nested layouts, each with their own router-outlet scope',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Wire up the corridor paths. You need three things in your Routes array: a redirect from the ' +
        'empty path so the app has a landing page, a parameterized route for module details, and a ' +
        'wildcard to catch bad URLs.',
      starterCode: [
        "import { Routes } from '@angular/router';",
        "import { BridgeComponent } from './bridge';",
        "import { ModuleDetailComponent } from './module-detail';",
        "import { HullBreachComponent } from './hull-breach';",
        '',
        'export const routes: Routes = [',
        '  // TODO: Add a redirect from the empty path to the bridge',
        '  // TODO: Add a route with a dynamic segment for module details',
        '  // TODO: Add a catch-all route for unknown paths',
        '];',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'pattern',
          pattern: "path:\\s*'[^']*:[^']*'",
          errorMessage: 'Add a route with a dynamic parameter segment (e.g., :id)',
        },
        {
          type: 'contains',
          value: 'redirectTo',
          errorMessage: 'Add a redirect route from the empty path',
        },
        {
          type: 'contains',
          value: 'pathMatch',
          errorMessage: 'Specify pathMatch on the redirect route',
        },
        {
          type: 'contains',
          value: '**',
          errorMessage: 'Add a wildcard route to catch unknown paths',
        },
        {
          type: 'order',
          patterns: ['redirectTo', '**'],
          errorMessage: 'Place the wildcard route after the redirect, because route order matters',
        },
      ],
      hints: [
        'Use :id in the path string to define a dynamic segment, e.g., \'module/:id\'',
        'The wildcard path \'**\' must be the last route since Angular matches top to bottom',
      ],
      successMessage:
        'All corridor paths configured! Your routes handle dynamic parameters, redirects, and ' +
        'graceful 404s. Next: building a proper navigation UI so nobody has to type URLs by hand.',
      explanation:
        'Order is the key insight. Angular scans routes top to bottom and takes the first match. ' +
        'The redirect handles the "no path" case, :id captures dynamic segments, and ** at the bottom ' +
        'catches everything that slipped through.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'All corridor paths are configured!',
    minStepsViewed: 6,
  },
};
