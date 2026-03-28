import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_05_CONTENT: StoryMissionContent = {
  chapterId: 5,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Station modules need configuration panels — interfaces where settings flow from data into the UI. ' +
        'Buttons that disable when systems are offline. Images that change based on module state. CSS classes ' +
        'that toggle with conditions. Property binding connects your component data directly to DOM element ' +
        'properties.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use square brackets to bind component data to element properties. When the data changes, the ' +
        'property updates automatically.',
      code: [
        '@Component({',
        "  selector: 'app-config-panel',",
        '  template: `',
        '    <button [disabled]="!isOnline">Activate Module</button>',
        '    <img [src]="moduleImage" [alt]="moduleName" />',
        '    <div [class.active]="isActive">Module Status</div>',
        '  `,',
        '})',
        'export class ConfigPanelComponent {',
        '  isOnline = true;',
        '  isActive = true;',
        "  moduleImage = '/assets/power-core.png';",
        "  moduleName = 'Power Core';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [4, 5, 6],
      explanation:
        'Square brackets bind a DOM property to a component expression. [disabled]="!isOnline" disables the ' +
        'button when isOnline is false. [src]="moduleImage" sets the image source dynamically. ' +
        '[class.active]="isActive" toggles the CSS class.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Property binding and interpolation look similar but serve different purposes. Interpolation converts ' +
        'to a string; property binding passes the raw value — booleans, objects, numbers.',
      code: [
        '@Component({',
        "  selector: 'app-config-panel',",
        '  template: `',
        '    <!-- Interpolation: always a string -->',
        '    <p>Power: {{ powerLevel }}</p>',
        '',
        '    <!-- Property binding: passes the actual number -->',
        '    <input [value]="powerLevel" />',
        '',
        '    <!-- Property binding: passes a boolean -->',
        '    <button [disabled]="isLocked">Override</button>',
        '',
        '    <!-- Property binding: passes an object -->',
        '    <div [style.color]="statusColor">{{ statusText }}</div>',
        '  `,',
        '})',
        'export class ConfigPanelComponent {',
        '  powerLevel = 75;',
        '  isLocked = true;',
        "  statusColor = '#00ff88';",
        "  statusText = 'Nominal';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [5, 8, 11, 14],
      explanation:
        'Use interpolation {{ }} for displaying text content. Use property binding [prop] when you need to ' +
        'pass non-string values (booleans, numbers, objects) or bind to element properties that are not text content.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Configuration panels are now bound to live module data. Property binding gives you precise control over ' +
        'every DOM property.',
      conceptTitle: 'Property Binding [property]',
      conceptBody:
        'Property binding uses square brackets to set an element\'s DOM property to a component expression. ' +
        'It is one-way: data flows from the component class to the template. Unlike interpolation (which ' +
        'always converts to a string), property binding preserves the original data type.',
      keyPoints: [
        'Use [property] for non-string values like booleans, numbers, and objects',
        '[class.name] toggles a CSS class, [style.prop] sets a style property',
        'Property binding is one-way: class to template — changes in the DOM do not flow back',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The configuration panel needs dynamic property bindings. Write a template that binds a ' +
        'button\'s disabled state, an image\'s src, and a div\'s CSS class to component data.',
      starterCode: [
        '<!-- Available variables: isOffline (boolean), imageSrc (string), isActive (boolean) -->',
        '',
        '<!-- TODO: Bind the button\'s disabled property to isOffline -->',
        '<button>Activate Module</button>',
        '',
        '<!-- TODO: Bind the image\'s src property to imageSrc -->',
        '<img alt="Module" />',
        '',
        '<!-- TODO: Bind a CSS class (e.g., class.active) to isActive -->',
        '<div>Module Status</div>',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'pattern',
          pattern: '\\[disabled\\]\\s*=',
          errorMessage: 'Use [disabled]="expression" property binding on the button',
        },
        {
          type: 'pattern',
          pattern: '\\[src\\]\\s*=',
          errorMessage: 'Use [src]="expression" property binding on the image',
        },
        {
          type: 'pattern',
          pattern: '\\[class\\.\\w+\\]\\s*=',
          errorMessage: 'Use [class.name]="expression" to toggle a CSS class on the div',
        },
        {
          type: 'notContains',
          value: ' disabled="',
          errorMessage: 'Use [disabled]="expression" property binding instead of the plain HTML disabled attribute',
        },
        {
          type: 'pattern',
          pattern: '\\[.*\\]\\s*=\\s*"',
          errorMessage: 'Property bindings should use the [prop]="expression" syntax',
        },
      ],
      hints: [
        'Use [disabled]="expression" to bind the button\'s disabled property to a component value',
        '[class.active]="isActive" toggles the \'active\' CSS class based on the expression',
      ],
      successMessage:
        'Configuration panel is bound to live module data! Every property updates when the data changes.',
      explanation:
        'Property binding [property]="expression" connects DOM properties to component data. Unlike ' +
        'interpolation which always produces strings, property binding preserves the data type -- ' +
        'booleans for disabled, strings for src, booleans for class toggles.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Configuration panels are bound to module data!',
    minStepsViewed: 5,
  },
};
