import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_13_CONTENT: StoryMissionContent = {
  chapterId: 13,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Routes exist, but there\'s no UI to navigate them. Right now the only way to move between ' +
        'views is typing URLs into the browser address bar -- not exactly a great user experience. ' +
        'Angular provides routerLink to turn elements into navigation triggers and routerLinkActive ' +
        'to highlight where the user currently is. Time to build a proper nav console.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'routerLink replaces plain href attributes. Why not just use href? Because href triggers a ' +
        'full page reload, destroying your app state. routerLink tells Angular to handle the navigation ' +
        'internally, keeping everything intact.',
      code: [
        '@Component({',
        "  selector: 'app-nav-console',",
        '  imports: [RouterLink, RouterLinkActive],',
        '  template: `',
        '    <nav>',
        '      <a routerLink="/bridge" routerLinkActive="active">Bridge</a>',
        '      <a routerLink="/engine-room" routerLinkActive="active">Engine Room</a>',
        '      <a [routerLink]="[\'/module\', moduleId]" routerLinkActive="active">',
        '        Module {{ moduleId }}',
        '      </a>',
        '    </nav>',
        '  `,',
        '})',
        'export class NavConsoleComponent {',
        "  moduleId = 'alpha-7';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [3, 6, 7, 8],
      explanation:
        'Two forms of routerLink: the string form (routerLink="/bridge") for static paths, and the ' +
        'array form ([routerLink]="[\'/module\', moduleId]") when you need to build a path from ' +
        'variables. routerLinkActive slaps a CSS class on the link when its route is active -- ' +
        'perfect for highlighting the current page in a navbar.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Not all navigation comes from clicking links. Sometimes code needs to redirect the user -- ' +
        'after saving a form, completing a workflow, or responding to an error. That\'s what ' +
        'Router.navigate() is for.',
      code: [
        "import { Router } from '@angular/router';",
        '',
        '@Component({ ... })',
        'export class EmergencyPanelComponent {',
        '  private router = inject(Router);',
        '',
        '  evacuateToModule(moduleId: string): void {',
        "    this.router.navigate(['/module', moduleId]);",
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [5, 8],
      explanation:
        'Inject the Router service and call navigate() with an array of path segments. It works ' +
        'exactly like the array form of routerLink, but from TypeScript code instead of a template. ' +
        'Use this whenever navigation is driven by logic rather than a direct user click.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Two tools, one job. routerLink is for templates, Router.navigate is for code. Pick the ' +
        'one that fits where the navigation decision happens.',
      conceptTitle: 'routerLink vs Router.navigate() -- When to Use Which',
      conceptBody:
        'If the user is clicking a link, use routerLink -- it\'s declarative, accessible, and gives ' +
        'you hover previews and right-click context menus for free. If navigation happens in response ' +
        'to logic (form submission, timer, error handling), use Router.navigate() in your component code.',
      keyPoints: [
        'routerLink avoids full-page reloads that href would cause -- Angular handles the transition internally',
        'routerLinkActive provides visual feedback without manual CSS class toggling',
        'Router.navigate() uses the same path-segment array syntax as routerLink\'s array form',
        'Prefer routerLink for user-facing links -- it preserves browser behaviors like middle-click to open in new tab',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Replace these dead links with Angular navigation. Add routerLink to each anchor so ' +
        'clicking actually navigates, and use routerLinkActive to highlight the current location.',
      starterCode: [
        '<nav class="station-nav">',
        '  <!-- TODO: Replace plain links with Angular navigation directives -->',
        '  <!-- TODO: Highlight the active link -->',
        '  <a href="#">Bridge</a>',
        '  <a href="#">Engine Room</a>',
        '  <a href="#">Crew Quarters</a>',
        '</nav>',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'contains',
          value: 'routerLink',
          errorMessage: 'Use the Angular navigation directive on each link',
        },
        {
          type: 'contains',
          value: 'routerLinkActive',
          errorMessage: 'Add active state highlighting to the navigation links',
        },
        {
          type: 'pattern',
          pattern: 'routerLink="/',
          errorMessage: 'Set an absolute path on at least one navigation link',
        },
        {
          type: 'notContains',
          value: 'href=',
          errorMessage: 'Remove plain href attributes — use Angular navigation instead of page reloads',
        },
      ],
      hints: [
        'Replace href="#" with routerLink="/path" -- use a path that makes sense for each link',
        'Add routerLinkActive="active" to each anchor so Angular applies the "active" class automatically',
      ],
      successMessage:
        'Navigation is live! Crew can click between modules and see where they are. ' +
        'Next challenge: navigating from code when logic demands it.',
      explanation:
        'routerLink turns a regular anchor into a SPA navigation trigger -- no page reload, no lost ' +
        'state. routerLinkActive watches the current URL and toggles a CSS class, giving you visual ' +
        'feedback without writing any JavaScript.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Emergency override time. Import the Router service, inject it, and use it to navigate ' +
        'programmatically when the evacuate method is called.',
      starterCode: [
        "import { Component } from '@angular/core';",
        "import { inject } from '@angular/core';",
        '// TODO: Import the navigation service from the router package',
        '',
        '@Component({',
        "  selector: 'app-emergency-panel',",
        "  template: `<button (click)=\"evacuate()\">Evacuate</button>`,",
        '})',
        'export class EmergencyPanelComponent {',
        '  // TODO: Inject the navigation service',
        '',
        '  evacuate(): void {',
        "    // TODO: Navigate to the safe module at '/safe-zone'",
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'inject(Router)',
          errorMessage: 'Inject the routing service using the inject function',
        },
        {
          type: 'pattern',
          pattern: '\\.navigate\\(',
          errorMessage: 'Call the navigate method to change the route programmatically',
        },
        {
          type: 'pattern',
          pattern: "\\[\\s*'/",
          errorMessage: 'Pass path segments as an array starting with a forward slash',
        },
        {
          type: 'pattern',
          pattern: "import.*Router.*from\\s+'@angular/router'",
          errorMessage: 'Import the routing service from the router package',
        },
      ],
      hints: [
        'Add Router to your import from \'@angular/router\', then store inject(Router) as a private field',
        'In evacuate(), call this.router.navigate([\'/safe-zone\']) -- note the array wrapper',
      ],
      successMessage:
        'Emergency navigation is operational! You\'ve mastered both declarative and programmatic ' +
        'navigation -- the two building blocks of Angular routing.',
      explanation:
        'Router.navigate() is the programmatic counterpart to routerLink. Inject the Router service, ' +
        'then call navigate() with an array of path segments. Same result, different trigger -- code ' +
        'instead of a click.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Navigation console is operational!',
    minStepsViewed: 6,
  },
};
