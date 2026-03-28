import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_05_CONTENT: StoryMissionContent = {
  chapterId: 5,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Interpolation converts everything to text. That works great for displaying values, but what about ' +
        'setting a button\'s disabled state? Or toggling a CSS class? Or pointing an image at a dynamic URL? ' +
        'You cannot do that with {{ }}. Property binding is how you connect component data directly to DOM ' +
        'properties — and unlike interpolation, it preserves the original data type.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Square brackets are the property binding syntax. [disabled]="!isOnline" does not insert a string — ' +
        'it passes a boolean directly to the DOM property. When isOnline changes, the button\'s disabled ' +
        'state updates automatically.',
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
        'Each square bracket binding connects a DOM property to a component expression. [disabled] receives ' +
        'a boolean. [src] receives a string URL. [class.active] adds or removes the "active" CSS class based ' +
        'on a boolean. The brackets are doing something fundamentally different from interpolation — they are ' +
        'setting properties on the DOM element, not inserting text.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is the difference side by side. Interpolation always produces a string. Property binding passes ' +
        'the actual value — a number stays a number, a boolean stays a boolean. This distinction matters when ' +
        'the DOM property expects a specific type.',
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
        '{{ powerLevel }} on line 5 becomes the string "75" in the DOM. [value]="powerLevel" on line 8 ' +
        'passes the number 75. For display text, it does not matter. But try disabling a button with ' +
        'disabled="{{ isLocked }}" — it will not work correctly because the string "false" is truthy. ' +
        'When the property expects a non-string type, use property binding.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'You now have two ways to get data from your class into the template. Knowing when to use which one ' +
        'is a skill you will use on every component you build.',
      conceptTitle: 'Property Binding [property]',
      conceptBody:
        'Property binding sets a DOM element\'s property to the result of a component expression. It is ' +
        'one-way, just like interpolation — data flows from class to template. The key difference: ' +
        'interpolation converts to a string, property binding preserves the type. Use interpolation for ' +
        'text content. Use property binding for everything else.',
      keyPoints: [
        'Use [property] when the value needs to stay its original type — booleans for disabled, numbers for value, strings for src. If you are setting text content, {{ }} is fine.',
        '[class.name] toggles a CSS class on or off. [style.prop] sets an inline style. These are shortcuts Angular provides for two of the most common DOM operations.',
        'Data flows one direction: class to template. If a user types in an input with [value], the class property does not update. You need event binding for that (coming later).',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The configuration panel needs three property bindings: disable a button based on isOffline, set ' +
        'an image source from imageSrc, and toggle a CSS class using isActive. Replace the static HTML ' +
        'with dynamic bindings.',
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
        'Add [disabled]="isOffline" to the button. The brackets tell Angular this is a binding, not a static attribute.',
        '[class.active]="isActive" adds the "active" class when isActive is true and removes it when false.',
      ],
      successMessage:
        'Configuration panel is wired up. You now have two tools for getting data into the template: ' +
        '{{ }} for text, [property] for everything else. Together they cover most of what you need for ' +
        'one-way data flow.',
      explanation:
        'Property binding connects DOM properties to component data while preserving types. [disabled] ' +
        'gets a boolean, [src] gets a string, [class.active] gets a boolean. Interpolation would turn ' +
        'all of these into strings, which breaks things like disabled (the string "false" is truthy).',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Configuration panels are bound to module data!',
    minStepsViewed: 5,
  },
};
