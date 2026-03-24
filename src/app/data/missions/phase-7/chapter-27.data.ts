import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_27_CONTENT: StoryMissionContent = {
  chapterId: 27,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station\'s module bays are rigid — each component renders a fixed layout, making it ' +
        'impossible to reuse the same structural frame with different interior content. Deep space ' +
        'operations demand flexible containers that accept arbitrary child content from the parent. ' +
        'Angular\'s content projection with ng-content lets you build wrapper components that render ' +
        'whatever the consumer places inside their tags.',
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
        '<ng-content /> is a placeholder that Angular replaces with whatever child elements the parent ' +
        'places inside <app-module-bay>...</app-module-bay>. The module bay component defines the frame, ' +
        'but the parent controls what appears inside it. This is single-slot content projection.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use the select attribute on ng-content to project specific children into designated slots ' +
        'based on CSS selectors.',
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
        'The select attribute accepts a CSS selector to match specific projected elements. Content ' +
        'matching [panel-title] goes into the header, [panel-actions] into the footer, and everything ' +
        'else falls through to the default <ng-content /> without a select attribute. This is ' +
        'multi-slot content projection.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Universal module bays are online. Here is how content projection creates flexible container components.',
      conceptTitle: 'Content Projection with ng-content and select',
      conceptBody:
        'Content projection lets a component accept arbitrary child content from its parent and render ' +
        'it in designated slots. Use <ng-content /> for single-slot projection, and add the select ' +
        'attribute with a CSS selector for multi-slot projection. Unmatched content falls through to ' +
        'the default slot (ng-content without select).',
      keyPoints: [
        '<ng-content /> projects all child content into a single slot',
        'select="[attr]" or select=".class" routes specific children to named slots',
        'A default <ng-content /> without select catches unmatched content',
        'Content projection enables reusable layout wrappers like cards, panels, and dialogs',
      ],
    },
  ],
  completionCriteria: {
    description: 'Universal module bays online!',
    minStepsViewed: 4,
  },
};
