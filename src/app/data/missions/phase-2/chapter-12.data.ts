import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_12_CONTENT: StoryMissionContent = {
  chapterId: 12,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The station map shows module locations, but the corridors need paths — specific routes with ' +
        'parameters so crew can navigate to individual modules by ID. Some corridors are blocked, requiring ' +
        'redirects. And if a crew member wanders off the map, a "Hull Breach" warning must display. Angular ' +
        'routes handle all of these: paths, parameters, redirects, and wildcards.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Route parameters let crew navigate to a specific module by ID. The colon syntax defines a dynamic ' +
        'segment, and withComponentInputBinding delivers it as a signal input.',
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
        'The :id segment in the path captures a dynamic value from the URL. withComponentInputBinding ' +
        'lets Angular deliver route parameters directly to signal inputs on the component.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Not every corridor leads somewhere. A redirect sends crew from one path to another, and the ' +
        'wildcard route catches anyone who wanders off the map.',
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
        'redirectTo sends users from one path to another. The wildcard ** matches any unrecognized URL — ' +
        'place it last because Angular matches routes in order.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Some station sections have sub-areas. Child routes let you nest layouts — the engineering deck ' +
        'has its own internal navigation within the main station layout.',
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
        'Child routes render inside the parent component\'s own router-outlet. This creates nested layouts — ' +
        'the engineering section has its own navigation within the station\'s main layout.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'All corridor paths are configured. Here is the full picture of route configuration.',
      conceptTitle: 'Route Configuration — paths, params, wildcards',
      conceptBody:
        'Route configuration is an ordered array of path-to-component mappings. Angular matches the first ' +
        'route whose path fits the URL. The order matters — more specific routes should come before ' +
        'general ones, with the wildcard always last.',
      keyPoints: [
        'Route parameters (:param) capture URL segments as dynamic values',
        'redirectTo navigates from one path to another (requires pathMatch)',
        'The wildcard ** catches unmatched URLs — always place it last',
        'Child routes create nested layouts with nested router-outlets',
      ],
    },
  ],
  completionCriteria: {
    description: 'All corridor paths are configured!',
    minStepsViewed: 5,
  },
};
