import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_06_CONTENT: StoryMissionContent = {
  chapterId: 6,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The crew can see data on their displays, but they cannot interact with anything. Buttons do nothing. ' +
        'Input fields are dead. The station needs event handling — the ability for the UI to respond when ' +
        'a crew member clicks a button, types a command, or hovers over a control.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use parentheses to listen to DOM events. When the event fires, Angular calls the method you specify.',
      code: [
        '@Component({',
        "  selector: 'app-crew-controls',",
        '  template: `',
        '    <button (click)="onActivate()">Activate Module</button>',
        '    <input (keyup)="onKeyPress($event)" />',
        '    <p>Last action: {{ lastAction }}</p>',
        '  `,',
        '})',
        'export class CrewControlsComponent {',
        "  lastAction = 'none';",
        '',
        '  onActivate() {',
        "    this.lastAction = 'Module activated';",
        '  }',
        '',
        '  onKeyPress(event: KeyboardEvent) {',
        '    this.lastAction = `Key pressed: ${event.key}`;',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [4, 5],
      explanation:
        'Parentheses bind to a DOM event. (click)="onActivate()" calls onActivate() when the button is clicked. ' +
        '$event gives access to the native event object — here, a KeyboardEvent with the key property.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'You can listen to any DOM event — mouse events, keyboard events, input events. Use $event to access ' +
        'the event details.',
      code: [
        '@Component({',
        "  selector: 'app-crew-controls',",
        '  template: `',
        '    <div',
        '      (mouseenter)="onHover(true)"',
        '      (mouseleave)="onHover(false)"',
        '      [class.highlighted]="isHovered">',
        '      Hover for details',
        '    </div>',
        '    <input',
        '      (input)="onSearch($event)"',
        '      placeholder="Search crew..." />',
        '    <p>Search: {{ searchTerm }}</p>',
        '  `,',
        '})',
        'export class CrewControlsComponent {',
        '  isHovered = false;',
        "  searchTerm = '';",
        '',
        '  onHover(hovered: boolean) {',
        '    this.isHovered = hovered;',
        '  }',
        '',
        '  onSearch(event: Event) {',
        '    this.searchTerm = (event.target as HTMLInputElement).value;',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [5, 6, 11],
      explanation:
        'Any DOM event can be bound: mouseenter, mouseleave, input, focus, blur, and more. The $event object ' +
        'is the native DOM event. For input events, cast event.target to access the element\'s value.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The crew can now interact with station controls. Every button press, key stroke, and mouse movement ' +
        'can trigger logic in your components.',
      conceptTitle: 'Event Handling (event)',
      conceptBody:
        'Event binding uses parentheses to listen to DOM events and call component methods. The $event variable ' +
        'gives you access to the native event object. This is the complement to property binding — data flows ' +
        'from the template (user actions) back to the component class.',
      keyPoints: [
        'Any DOM event can be bound: click, keyup, input, mouseenter, submit, and more',
        '$event provides the native event object with full type information',
        'Keep event handlers simple — delegate complex logic to service methods',
      ],
    },
  ],
  completionCriteria: {
    description: 'Crew can now interact with station controls!',
    minStepsViewed: 4,
  },
};
