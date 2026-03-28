import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_13_CONTENT: StoryMissionContent = {
  chapterId: 13,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Routes are configured. The router knows where every corridor leads. But the crew needs a ' +
        'navigation console — a UI with clickable links that trigger route changes. Typing URLs into a ' +
        'console is not how a space station works. Angular\'s routerLink directive turns elements into ' +
        'navigation triggers, and routerLinkActive highlights the current location.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Build the navigation console with routerLink directives. Each link triggers a route change, and ' +
        'routerLinkActive highlights which module the crew is currently in.',
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
        'routerLink binds a navigation path to an element. The string form (routerLink="/bridge") handles ' +
        'static paths, while the array form ([routerLink]="[segments]") handles dynamic segments. ' +
        'routerLinkActive adds a CSS class when the link\'s route is active.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Sometimes navigation happens in response to logic — an emergency evacuation, a completed repair, ' +
        'or a diagnostic result. Router.navigate handles programmatic route changes.',
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
        'Use Router.navigate() for programmatic navigation — when a route change is triggered by logic ' +
        'rather than a direct user click. Pass an array of path segments just like the array form of routerLink.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The navigation console is operational. Here is when to use each navigation approach.',
      conceptTitle: 'Navigation — routerLink vs Router.navigate()',
      conceptBody:
        'Template-driven navigation uses routerLink for declarative links that the user clicks. ' +
        'Programmatic navigation uses Router.navigate() for logic-driven route changes that happen in ' +
        'component code. Both produce the same result — a route transition — but serve different use cases.',
      keyPoints: [
        'routerLink is a directive that turns elements into clickable navigation triggers',
        'routerLinkActive adds a CSS class when the link\'s route is active',
        'Router.navigate([segments]) navigates programmatically from component code',
        'Prefer routerLink for user-facing links and Router.navigate for logic-triggered navigation',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Build the navigation console! Add Angular navigation directives to each link so crew can ' +
        'move between station modules, and highlight which module they are currently in.',
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
        'Replace href="#" with routerLink="/path" on each anchor tag',
        'Add routerLinkActive="active" to highlight the link when its route is active',
      ],
      successMessage:
        'Navigation console links are live! Crew can click to move between modules with active highlighting.',
      explanation:
        'routerLink turns an element into a navigation trigger that changes the route without reloading ' +
        'the page. routerLinkActive adds a CSS class when the link\'s route matches the current URL, ' +
        'providing visual feedback for the active location.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Emergency override! Write a component that injects the navigation service and navigates ' +
        'programmatically to the safe module when an evacuation is triggered.',
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
        'Import and inject the routing service, then call its navigate method in the evacuate function',
        'Pass an array of path segments like [\'/safe-zone\'] to the navigate method',
      ],
      successMessage:
        'Emergency navigation override active! The component can navigate programmatically to any module.',
      explanation:
        'Router.navigate() is for programmatic navigation — when route changes happen in response to ' +
        'logic rather than user clicks. Inject the Router with inject(Router) and pass an array of ' +
        'path segments to navigate().',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Navigation console is operational!',
    minStepsViewed: 6,
  },
};
