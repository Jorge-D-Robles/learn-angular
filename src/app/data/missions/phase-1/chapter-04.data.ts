import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_04_CONTENT: StoryMissionContent = {
  chapterId: 4,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The station needs an alert system. Sensor anomalies, hull breaches, crew emergencies — each requires ' +
        'a different response. Some alerts should only display when conditions are met. Others repeat for each ' +
        'crew member. And severity determines the display style. Angular\'s built-in control flow lets you ' +
        'render content conditionally, loop over collections, and switch between templates.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use @if to show an alert panel only when there is an active alert. The @else block provides a fallback.',
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
        '@if evaluates a condition and renders the block only when true. The @else block renders when the ' +
        'condition is false. Unlike older Angular syntax (*ngIf), this is built into the template language — ' +
        'no imports needed.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use @for to repeat a block for each item in a collection. The track expression helps Angular ' +
        'efficiently update the DOM when the list changes.',
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
        '@for iterates over an array. The track expression (track alert.id) tells Angular how to identify each ' +
        'item for efficient DOM updates. The @empty block renders when the array is empty.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use @switch when you need to pick one of several templates based on a value — like displaying ' +
        'different alert styles by severity level.',
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
        '@switch evaluates an expression and renders the matching @case block. The @default block handles ' +
        'any unmatched values. This is cleaner than chaining multiple @if/@else blocks.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Alert systems are online and routing through conditional logic. Here is the full picture of built-in control flow.',
      conceptTitle: 'Built-in Control Flow',
      conceptBody:
        'Angular provides three control flow constructs built directly into the template language: @if for ' +
        'conditional rendering, @for for iterating over collections, and @switch for multi-branch selection. ' +
        'These replace the older structural directives (*ngIf, *ngFor, *ngSwitch) with a cleaner, more ' +
        'readable syntax.',
      keyPoints: [
        'track is required for @for — it tells Angular how to identify items for efficient updates',
        'No imports needed — control flow is built into the template language',
        '@if/@for/@switch replace *ngIf/*ngFor/*ngSwitch from older Angular versions',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The triage system needs conditional rendering. Write a template that uses @if to show an ' +
        'emergency alert when active, and @for to list crew members needing attention.',
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
        '@if (condition) { ... } renders the block only when the condition is true',
        '@for (item of items; track item.id) { ... } repeats for each item -- track is required',
      ],
      successMessage:
        'Triage display is routing crew through conditional logic! The @if and @for blocks respond to live data.',
      explanation:
        'Angular\'s built-in control flow (@if, @for) replaces the older *ngIf and *ngFor directives. ' +
        '@if conditionally renders blocks, @for iterates over collections. The track expression in ' +
        '@for is mandatory -- it tells Angular how to efficiently update the DOM.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Alerts need severity-based display. Write a template using @switch to render different ' +
        'alert styles based on a severity value.',
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
        '@switch (expression) { @case (value) { ... } } selects which block to render',
        'Always include @default { ... } to handle unexpected values',
      ],
      successMessage:
        'Severity classification online! Alerts now route to the correct display based on their level.',
      explanation:
        '@switch is ideal when you need to choose between multiple templates based on a single value. ' +
        'It is cleaner than chaining @if/@else blocks and always include @default for safety.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Alert systems are routing through conditional logic!',
    minStepsViewed: 7,
  },
};
