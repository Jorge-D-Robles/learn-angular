import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'Navigation console is operational!',
    minStepsViewed: 4,
  },
};
