import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_11_CONTENT: StoryMissionContent = {
  chapterId: 11,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Everything you\'ve built so far lives on a single page. But real web apps have multiple views ' +
        '-- a dashboard, a settings page, a detail screen. Ever noticed how Gmail doesn\'t reload the ' +
        'whole page when you click an email? That\'s routing. Angular\'s router maps URL paths to ' +
        'components and swaps them in without a full page refresh. The station corridors have collapsed, ' +
        'and routing is how we reconnect them.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Routing starts with two things: a list of paths and a way to register them. Each route maps a ' +
        'URL like /bridge to the component Angular should display. provideRouter hands that list to ' +
        'the framework so it knows where everything lives.',
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
        'The Routes array is a lookup table -- each entry says "when the URL matches this path, render ' +
        'this component." provideRouter registers that table with Angular at startup. Without it, the ' +
        'router wouldn\'t know any of your paths exist.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Routes are registered, but Angular still needs to know where on the page to display the ' +
        'matched component. Think of router-outlet as a viewport -- a designated spot in your layout ' +
        'where routed content appears.',
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
        'router-outlet is Angular\'s placeholder. When the URL changes, Angular looks up the matching ' +
        'component and drops it right where router-outlet sits. The header stays put; only the content ' +
        'inside <main> swaps. That\'s the single-page app magic.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Think of routing like a building\'s floor directory. The URL is the floor number, and ' +
        'router-outlet is the elevator that takes you there.',
      conceptTitle: 'Routing Basics -- How Angular Navigates Without Reloading',
      conceptBody:
        'Angular\'s router intercepts browser URL changes and swaps the matching component into ' +
        'router-outlet -- all without reloading the page. The browser address bar updates, the back ' +
        'button works, but the page never blinks. That\'s what makes it a single-page application.',
      keyPoints: [
        'provideRouter() is a one-time setup that tells Angular about all your routes',
        'router-outlet is the "screen" where matched components appear -- put it wherever you want routed content',
        'No page reload means faster transitions and preserved application state',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Time to reconnect those station corridors. Define a Routes array that maps URL paths to ' +
        'components, then register it with the routing provider so Angular knows how to navigate.',
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
        'Create a const typed as Routes with objects like { path: \'bridge\', component: BridgeComponent }',
        'Import provideRouter and call it inside the providers array, passing your routes as the argument',
      ],
      successMessage:
        'Corridors reconnected! Angular now knows which component to show for each URL. ' +
        'Next up: dynamic route parameters so you can navigate to specific modules by ID.',
      explanation:
        'The Routes array is the map; provideRouter is the registration. Without both, Angular has no ' +
        'idea which component belongs at which URL. Once registered, the router handles all navigation ' +
        'automatically.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'You restored routing to Nexus Station!',
    minStepsViewed: 5,
  },
};
