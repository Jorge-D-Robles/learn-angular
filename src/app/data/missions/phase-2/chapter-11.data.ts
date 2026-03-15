import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'You restored routing to Nexus Station!',
    minStepsViewed: 4,
  },
};
