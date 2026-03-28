import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_11_CONTENT: StoryMissionContent = {
  chapterId: 11,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The corridors between station modules have collapsed. Crew members are trapped in isolated sections ' +
        'with no way to move between them. To reconnect Nexus Station, you need a routing system — a way to ' +
        'navigate between module views without rebuilding the entire station each time. Angular\'s router maps ' +
        'URL paths to components and renders them in a designated outlet.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is the blueprint for the station routing system. provideRouter registers routes with the ' +
        'application, and each route maps a URL path to a component.',
      code: [
        "import { Routes } from '@angular/router';",
        "import { provideRouter } from '@angular/router';",
        '',
        'export const routes: Routes = [',
        "  { path: 'bridge', component: BridgeComponent },",
        "  { path: 'engine-room', component: EngineRoomComponent },",
        '];',
        '',
        '// In app.config.ts:',
        'export const appConfig = {',
        '  providers: [provideRouter(routes)],',
        '};',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [4, 5, 6, 11],
      explanation:
        'provideRouter registers the router with the application. Each route object maps a URL path ' +
        'to a component that Angular will render when the user navigates to that path.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Routes are registered, but the station needs a viewport — a place where Angular renders the active ' +
        'route\'s component. That is what router-outlet provides.',
      code: [
        '@Component({',
        "  selector: 'app-root',",
        '  imports: [RouterOutlet],',
        '  template: `',
        '    <header>Nexus Station</header>',
        '    <main>',
        '      <router-outlet />',
        '    </main>',
        '  `,',
        '})',
        'export class AppComponent {}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [3, 7],
      explanation:
        'router-outlet is a placeholder that Angular replaces with the component matching the current URL. ' +
        'Place it where you want routed content to appear.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The station corridors are reconnecting. Here is how Angular routing works at a high level.',
      conceptTitle: 'Routing Basics — provideRouter and router-outlet',
      conceptBody:
        'Angular\'s router intercepts URL changes and renders the matching component inside router-outlet. ' +
        'The browser does not reload the page — Angular swaps components in place, creating a single-page ' +
        'application (SPA) experience.',
      keyPoints: [
        'provideRouter() registers routes at the application level',
        'router-outlet marks where routed components render',
        'The browser URL updates without a full page reload',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Reconnect the station corridors! Define a Routes array mapping paths to components, ' +
        'then wire it into the app config with the routing provider.',
      starterCode: [
        "import { Routes } from '@angular/router';",
        "import { BridgeComponent } from './bridge';",
        "import { EngineRoomComponent } from './engine-room';",
        '',
        '// TODO: Define an array of route objects that map URL paths to components',
        '',
        '// TODO: Configure the app with the routing provider',
        'export const appConfig = {',
        '  providers: [],',
        '};',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'Routes',
          errorMessage: 'Declare a Routes-typed array for your route definitions',
        },
        {
          type: 'pattern',
          pattern: "path:\\s*'",
          errorMessage: 'Add at least one route with a path property',
        },
        {
          type: 'pattern',
          pattern: 'component:\\s*\\w+',
          errorMessage: 'Map each route to a component',
        },
        {
          type: 'contains',
          value: 'provideRouter',
          errorMessage: 'Use the routing provider function to register routes with the app',
        },
        {
          type: 'order',
          patterns: ['Routes', 'provideRouter'],
          errorMessage: 'Define the Routes array before passing it to the routing provider',
        },
      ],
      hints: [
        'Define a const with type Routes containing objects like { path: \'bridge\', component: BridgeComponent }',
        'Call the routing provider function inside the providers array, passing your routes',
      ],
      successMessage:
        'Station corridors reconnected! Routes are defined and the router provider is wired into the app.',
      explanation:
        'A Routes array maps URL paths to components. The routing provider function registers ' +
        'these routes with Angular so the router can match URLs to components and render them.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'You restored routing to Nexus Station!',
    minStepsViewed: 5,
  },
};
