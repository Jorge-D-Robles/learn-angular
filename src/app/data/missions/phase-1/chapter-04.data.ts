import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_04_CONTENT: StoryMissionContent = {
  chapterId: 4,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'You can display data with interpolation. But what if you only want to show something when a condition ' +
        'is true? Or repeat it for every item in a list? The station needs an alert system — sensor anomalies, ' +
        'hull breaches, crew emergencies — and each one requires different handling. Angular\'s built-in control ' +
        'flow gives you @if, @for, and @switch, right inside the template. No imports, no setup.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Show an alert only when there is one. @if works exactly like you would expect from JavaScript — ' +
        'if the condition is true, the block renders. If not, it does not. The @else block is your fallback.',
      code: [
        '@Component({',
        "  selector: 'app-alert-panel',",
        '  template: `',
        '    @if (hasAlert) {',
        '      <div class="alert">',
        '        Warning: {{ alertMessage }}',
        '      </div>',
        '    } @else {',
        '      <p>All systems nominal.</p>',
        '    }',
        '  `,',
        '})',
        'export class AlertPanelComponent {',
        '  hasAlert = true;',
        "  alertMessage = 'Oxygen levels dropping in Sector 3';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [4, 8],
      explanation:
        'When hasAlert is true, Angular renders the alert div. When it is false, you get "All systems nominal." ' +
        'The element is not hidden with CSS — it literally does not exist in the DOM until the condition is met. ' +
        'This is the modern syntax. Older Angular used *ngIf, which required importing a directive. The @if ' +
        'syntax is built into the template language.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'What about lists? @for repeats a block for every item in an array. The catch: you must provide ' +
        'a track expression. Why? Because when items change, Angular needs a way to tell which DOM elements ' +
        'to update instead of rebuilding the entire list. Track gives it that identity.',
      code: [
        '@Component({',
        "  selector: 'app-crew-alerts',",
        '  template: `',
        '    <h3>Crew Alerts</h3>',
        '    @for (alert of alerts; track alert.id) {',
        '      <div class="alert-item">',
        '        {{ alert.crewMember }}: {{ alert.message }}',
        '      </div>',
        '    } @empty {',
        '      <p>No active alerts.</p>',
        '    }',
        '  `,',
        '})',
        'export class CrewAlertsComponent {',
        '  alerts = [',
        "    { id: 1, crewMember: 'Voss', message: 'Suit pressure low' },",
        "    { id: 2, crewMember: 'Chen', message: 'EVA timeout approaching' },",
        '  ];',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [5, 9],
      explanation:
        '@for loops over the alerts array and renders a div for each one. track alert.id tells Angular ' +
        '"use the id field to identify each item" — this is how Angular avoids throwing away and rebuilding ' +
        'DOM nodes unnecessarily. The @empty block renders when the array has zero items, which is a nice ' +
        'touch for UX.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Sometimes you need more than if/else. When a single value determines which of several templates ' +
        'to show, @switch is cleaner than a chain of @if/@else blocks. Think of it like a JavaScript switch ' +
        'statement, but for templates.',
      code: [
        '@Component({',
        "  selector: 'app-severity-display',",
        '  template: `',
        '    @switch (severity) {',
        "      @case ('critical') {",
        '        <div class="critical">CRITICAL: Immediate action required</div>',
        '      }',
        "      @case ('warning') {",
        '        <div class="warning">WARNING: Monitor closely</div>',
        '      }',
        '      @default {',
        '        <div class="info">INFO: Status update</div>',
        '      }',
        '    }',
        '  `,',
        '})',
        'export class SeverityDisplayComponent {',
        "  severity = 'critical';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [4, 5, 8, 11],
      explanation:
        'Angular evaluates severity, then renders whichever @case matches. If nothing matches, @default ' +
        'kicks in. This is much easier to read than nesting three @if/@else blocks, and it makes the intent ' +
        'obvious: "pick one of these based on this value."',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The alert system is routing through conditional logic. These three constructs cover the vast majority ' +
        'of template control flow you will ever need.',
      conceptTitle: 'Built-in Control Flow',
      conceptBody:
        '@if, @for, and @switch are built directly into Angular\'s template language. They replaced the older ' +
        '*ngIf, *ngFor, and *ngSwitch directives, which required imports and had a less readable syntax. The ' +
        'new syntax looks like the JavaScript you already know, which was the whole point of the redesign.',
      keyPoints: [
        'track is required on every @for loop. It is not optional. Angular uses it to efficiently update the DOM when list items change — without it, Angular would have to destroy and recreate every element.',
        'No imports needed. Unlike the old *ngIf/*ngFor directives, the new control flow is part of the template language itself.',
        '@empty on @for and @else on @if are small touches that save you from writing extra @if checks. Use them.',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The triage system needs two things: an emergency alert that only shows when isEmergency is true, ' +
        'and a list of crew members. Use @if for the conditional and @for for the list. Remember — track ' +
        'is required.',
      starterCode: [
        '<!-- Available variables: isEmergency (boolean), crewMembers (array with id, name) -->',
        '',
        '<!-- TODO: Show an emergency alert only when isEmergency is true -->',
        '',
        '<!-- TODO: List each crew member by name (track expression required) -->',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'contains',
          value: '@if',
          errorMessage: 'Use @if for conditional rendering of the emergency alert',
        },
        {
          type: 'contains',
          value: '@for',
          errorMessage: 'Use @for to iterate over the crew members list',
        },
        {
          type: 'pattern',
          pattern: 'track\\s+\\w+',
          errorMessage: 'Add a track expression to your @for loop (e.g., track member.id)',
        },
        {
          type: 'pattern',
          pattern: '@if\\s*\\(.*\\)\\s*\\{',
          errorMessage: 'Use the @if (condition) { ... } block syntax with a condition in parentheses',
        },
        {
          type: 'notContains',
          value: '*ngIf',
          errorMessage: 'Use the modern @if syntax instead of the older *ngIf directive',
        },
      ],
      hints: [
        '@if (isEmergency) { ... } renders the block only when the condition is true.',
        '@for (member of crewMembers; track member.id) { ... } loops over the array. The track part is mandatory.',
      ],
      successMessage:
        'Triage display is live. @if and @for are the two control flow constructs you will reach for ' +
        'most often — they handle probably 90% of conditional and list rendering in real apps.',
      explanation:
        '@if renders content conditionally. @for iterates over arrays. Both are part of the template ' +
        'language — no imports needed. The track expression on @for is mandatory because it is how ' +
        'Angular knows which DOM elements to reuse when data changes.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Alerts need severity-based display. Write a template that uses @switch to show different content ' +
        'based on a severity value. Handle \'critical\', \'warning\', and include a @default for anything else.',
      starterCode: [
        "<!-- Available variable: severity ('critical' | 'warning' | 'info') -->",
        '',
        '<!-- TODO: Render different alert displays based on severity -->',
        "<!-- Handle 'critical', 'warning', and all other severity values -->",
        '<div>Alert display here</div>',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'contains',
          value: '@switch',
          errorMessage: 'Use @switch to select a template based on the severity value',
        },
        {
          type: 'contains',
          value: '@case',
          errorMessage: 'Add at least one @case block for a severity level',
        },
        {
          type: 'pattern',
          pattern: '@case\\s*\\(.*\\)',
          errorMessage: 'Each @case needs a value in parentheses, e.g., @case (\'critical\')',
        },
        {
          type: 'contains',
          value: '@default',
          errorMessage: 'Include a @default block to handle unexpected severity values',
        },
      ],
      hints: [
        'Start with @switch (severity) { }, then add @case (\'critical\') { } blocks inside.',
        'Always include @default { } as a catch-all. It handles values you did not explicitly match.',
      ],
      successMessage:
        'Severity routing is online. @switch is the clearest way to handle multi-branch template logic. ' +
        'You now have all three control flow constructs — @if, @for, @switch — in your toolkit.',
      explanation:
        '@switch picks one block to render based on a value. It is the template equivalent of a JavaScript ' +
        'switch statement. Always include @default as a safety net for values you did not anticipate.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Alert systems are routing through conditional logic!',
    minStepsViewed: 7,
  },
};
