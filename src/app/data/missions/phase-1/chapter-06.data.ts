import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_06_CONTENT: StoryMissionContent = {
  chapterId: 6,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'So far, data has flowed one direction: from your component class into the template. Buttons render ' +
        'but don\'t do anything. Inputs display but don\'t respond. That\'s about to change. Event handling ' +
        'flips the arrow. Now the template talks back to your code. When a crew member clicks a button ' +
        'or types a command, your component can react.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Remember how square brackets push data INTO the template? Parentheses do the opposite. They listen ' +
        'for something happening in the template and call your code in response. Think of it like a doorbell: ' +
        'something happens in the world, and your component answers.',
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
        'Notice the parentheses instead of square brackets. That\'s how Angular distinguishes "data going in" ' +
        'from "events coming out." (click)="onActivate()" calls your method when the button is clicked. ' +
        'The $event variable in the keyup binding is Angular handing you the raw keyboard event, ' +
        'so you can check which key was pressed.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Clicks aren\'t the only thing you can listen to. Any DOM event works: mouse movements, focus changes, ' +
        'text input. The pattern is always the same: wrap the event name in parentheses and point it at a method.',
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
        'mouseenter, mouseleave, input, focus, blur: they all follow the same (eventName)="handler()" pattern. ' +
        'One thing that trips people up: $event gives you the native DOM event, which means for input events you ' +
        'need to cast event.target to HTMLInputElement to access .value. A bit clunky, but it keeps the type system honest.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The crew can finally interact with station controls. Every button press, keystroke, and mouse movement ' +
        'now has a direct line to your component logic.',
      conceptTitle: 'Event Handling with (event)',
      conceptBody:
        'Event binding closes the loop. Property binding (square brackets) sends data from class to template. ' +
        'Event binding (parentheses) sends user actions from template back to class. Together, they create ' +
        'a two-way conversation between your TypeScript and your HTML.',
      keyPoints: [
        'Parentheses for events, square brackets for data. Angular\'s syntax makes the direction of data flow visible at a glance',
        '$event is Angular saying "here\'s what just happened." It carries the native DOM event, so you get full type information',
        'Keep handlers thin: do the simple stuff in the method, delegate heavy logic to services (you\'ll build those in Chapter 16)',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'The station control panel is unresponsive. Buttons and inputs don\'t do anything yet. Wire up a click ' +
        'handler on the button and a keyup handler on the input so the crew can actually interact with it.',
      starterCode: [
        '<!-- Available variables/methods: onActivate() (method), onCommand($event) (method) -->',
        '',
        '<!-- TODO: Add a click handler to the button that calls onActivate() -->',
        '<button>Activate Module</button>',
        '',
        '<!-- TODO: Add a keyup handler to the input that calls onCommand with the event -->',
        '<input placeholder="Enter command..." />',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'pattern',
          pattern: '\\(click\\)\\s*=',
          errorMessage: 'Use (click) event binding on the button',
        },
        {
          type: 'pattern',
          pattern: '\\(keyup\\)\\s*=',
          errorMessage: 'Use (keyup) event binding on the input',
        },
        {
          type: 'contains',
          value: '$event',
          errorMessage: 'Pass $event to the keyup handler to access the keyboard event',
        },
        {
          type: 'notContains',
          value: 'onclick',
          errorMessage: 'Use Angular (click) event binding instead of the HTML onclick attribute',
        },
        {
          type: 'notContains',
          value: 'addEventListener',
          errorMessage: 'Use Angular event binding instead of addEventListener',
        },
      ],
      hints: [
        'Wrap the event name in parentheses: (click)="methodName()", same syntax you saw in the examples above',
        'For the keyup handler, pass $event so the method can see which key was pressed: (keyup)="onCommand($event)"',
      ],
      successMessage:
        'The control panel is live! You\'ve got two-way communication now. Data flows out to the template, ' +
        'and events flow back in. Next up: making components reusable by passing data into them with inputs.',
      explanation:
        'Event binding with parentheses is the counterpart to property binding with square brackets. ' +
        '(click)="handler()" calls your method on click. $event passes along the native DOM event ' +
        'so your handler can inspect what happened: which key was pressed, what text was entered, where the mouse was.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Crew can now interact with station controls!',
    minStepsViewed: 5,
  },
};
