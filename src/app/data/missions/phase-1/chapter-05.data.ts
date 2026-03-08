import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'Configuration panels are bound to module data!',
    minStepsViewed: 4,
  },
};
