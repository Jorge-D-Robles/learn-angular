import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_33_CONTENT: StoryMissionContent = {
  chapterId: 33,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Nexus Station\'s crew interfaces feel static — panels snap open and closed, alerts appear ' +
        'without warning, and state changes happen instantly with no visual context. Deep space ' +
        'operations demand smooth visual feedback so crew can track what changed and why. Angular ' +
        'Animations provide a declarative API for defining transitions between states, giving the ' +
        'crew clear visual cues during critical operations.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Define an animation trigger with states and a transition. The trigger attaches to a template ' +
        'element and animates between named states.',
      code: [
        "import { Component } from '@angular/core';",
        "import { trigger, state, transition, style, animate } from '@angular/animations';",
        '',
        '@Component({',
        "  selector: 'app-blast-door',",
        '  template: `',
        '    <div [@doorState]="isOpen ? \'open\' : \'closed\'"',
        '         class="door">',
        '      {{ isOpen ? "OPEN" : "SEALED" }}',
        '    </div>',
        '    <button (click)="toggle()">Toggle Door</button>',
        '  `,',
        '  animations: [',
        "    trigger('doorState', [",
        "      state('closed', style({ height: '50px', backgroundColor: '#8b0000' })),",
        "      state('open', style({ height: '200px', backgroundColor: '#006400' })),",
        "      transition('closed <=> open', [animate('300ms ease-in-out')]),",
        '    ]),',
        '  ],',
        '})',
        'export class BlastDoorComponent {',
        '  isOpen = false;',
        '',
        '  toggle() {',
        '    this.isOpen = !this.isOpen;',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 7, 13, 14, 15, 16, 17],
      explanation:
        'trigger() creates a named animation attached via [@triggerName]. state() defines style ' +
        'snapshots for named states. transition() specifies how to animate between states — the ' +
        '\'closed <=> open\' shorthand means "animate in both directions." animate() controls the ' +
        'timing with duration and easing. Add the animations array to the @Component metadata.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Use :enter and :leave aliases to animate elements as they are added to or removed from the DOM.',
      code: [
        "import { Component, signal } from '@angular/core';",
        "import { trigger, transition, style, animate } from '@angular/animations';",
        '',
        '@Component({',
        "  selector: 'app-alert-panel',",
        '  template: `',
        '    @if (showAlert()) {',
        '      <div @fadeInOut class="alert">',
        '        Hull breach detected in Sector 7!',
        '      </div>',
        '    }',
        '    <button (click)="showAlert.set(!showAlert())">Toggle Alert</button>',
        '  `,',
        '  animations: [',
        "    trigger('fadeInOut', [",
        "      transition(':enter', [",
        '        style({ opacity: 0, transform: \'translateY(-20px)\' }),',
        "        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),",
        '      ]),',
        "      transition(':leave', [",
        "        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' })),",
        '      ]),',
        '    ]),',
        '  ],',
        '})',
        'export class AlertPanelComponent {',
        '  showAlert = signal(true);',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 8, 14, 15, 16, 20],
      explanation:
        ':enter matches when an element is inserted into the DOM (e.g., via @if). :leave matches when ' +
        'it is removed. The enter transition starts from an invisible, offset position and animates to ' +
        'the final style. The leave transition animates out before Angular removes the element. These ' +
        'aliases replace the need for named states when animating presence.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Visual feedback systems are live. Here is how Angular Animations create smooth transitions.',
      conceptTitle: 'Angular Animations — trigger, state, transition, animate',
      conceptBody:
        'Angular Animations use a declarative API: trigger() names the animation, state() defines style ' +
        'snapshots, transition() specifies when to animate, and animate() controls timing. Attach triggers ' +
        'to elements with [@triggerName]. Use :enter and :leave for DOM insertion/removal animations. ' +
        'Enable animations by adding provideAnimations() to your app config.',
      keyPoints: [
        'trigger() creates a named animation bound to elements via [@name]',
        'state() and style() define the visual snapshots for each state',
        'transition() with animate() controls timing, easing, and direction',
        ':enter and :leave animate elements being added to or removed from the DOM',
      ],
    },
  ],
  completionCriteria: {
    description: 'Visual feedback systems live!',
    minStepsViewed: 4,
  },
};
