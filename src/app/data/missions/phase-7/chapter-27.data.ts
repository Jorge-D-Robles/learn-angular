import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_27_CONTENT: StoryMissionContent = {
  chapterId: 27,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Your components have fixed templates, so whatever HTML you put in the template is all they ever ' +
        'render. But what if you want a reusable card component that accepts different content each time? ' +
        'Think of a picture frame: the frame provides structure, but you decide what photo goes inside. ' +
        'Angular\'s content projection with ng-content works exactly like that. You build the frame once, ' +
        'and consumers slot in whatever content they need.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use <ng-content> to create a card component that projects any child content into its body area.',
      code: [
        "import { Component } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-module-bay',",
        '  template: `',
        '    <div class="bay-frame">',
        '      <div class="bay-header">Module Bay</div>',
        '      <div class="bay-content">',
        '        <ng-content />',
        '      </div>',
        '    </div>',
        '  `,',
        '})',
        'export class ModuleBayComponent {}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [9],
      explanation:
        '<ng-content /> is the slot. Angular replaces it with whatever the parent puts between ' +
        '<app-module-bay> tags. The module bay defines the frame, the parent controls the photo. ' +
        'Why ng-content instead of passing HTML as a string input? Because projected content is ' +
        'compiled in the parent\'s context, so event bindings and template variables work correctly.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'One slot isn\'t always enough. What if your panel needs a title in the header, actions in the ' +
        'footer, and general content in the middle? The select attribute lets you route children to ' +
        'specific slots using CSS selectors.',
      code: [
        "import { Component } from '@angular/core';",
        '',
        '@Component({',
        "  selector: 'app-station-panel',",
        '  template: `',
        '    <header>',
        '      <ng-content select="[panel-title]" />',
        '    </header>',
        '    <main>',
        '      <ng-content />',
        '    </main>',
        '    <footer>',
        '      <ng-content select="[panel-actions]" />',
        '    </footer>',
        '  `,',
        '})',
        'export class StationPanelComponent {}',
        '',
        '// Usage:',
        '// <app-station-panel>',
        '//   <h2 panel-title>Reactor Status</h2>',
        '//   <p>Core temperature nominal.</p>',
        '//   <button panel-actions>Shutdown</button>',
        '// </app-station-panel>',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [7, 10, 13],
      explanation:
        'Each ng-content with a select attribute grabs matching children: [panel-title] goes to the ' +
        'header, [panel-actions] to the footer. Everything that doesn\'t match a selector falls through ' +
        'to the bare <ng-content /> without select. That\'s your catch-all default slot. This pattern ' +
        'powers reusable layouts like cards, dialogs, and dashboards across Angular codebases.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'You now have the tools to build components that are genuinely flexible, containers that ' +
        'provide structure without dictating content.',
      conceptTitle: 'Content Projection: Reusable Containers with ng-content',
      conceptBody:
        'Content projection solves a fundamental problem: how do you build a reusable wrapper without ' +
        'hardcoding what goes inside? Use <ng-content /> for a single slot, and add select with a ' +
        'CSS selector when you need multiple named slots. Anything that doesn\'t match a selector ' +
        'falls through to the default slot. The projected content stays compiled in the parent\'s ' +
        'context, which is why bindings and event handlers just work.',
      keyPoints: [
        'ng-content is a slot. The parent decides what fills it, the child decides where it goes',
        'select="[attr]" or select=".class" creates named slots for routing specific children',
        'Unmatched content falls through to the default ng-content (the one without select)',
        'Projected content is compiled in the parent\'s context, so bindings work as you\'d expect',
      ],
    },
  ],
  completionCriteria: {
    description: 'Universal module bays online!',
    minStepsViewed: 4,
  },
};
