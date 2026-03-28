import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_33_CONTENT: StoryMissionContent = {
  chapterId: 33,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Your UI works, but state changes are instant and jarring. An alert appears out of nowhere. ' +
        'A panel snaps open. The user has no visual context for what changed. Animations are like turn ' +
        'signals on a car — the state change happens either way, but the animation tells the user WHAT ' +
        'changed and WHERE to look. Angular provides a declarative animation API that ties directly ' +
        'into component state, so transitions feel intentional rather than bolted on.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Start with the core pattern: define named states with styles, then describe how to transition ' +
        'between them. This blast door animates between "closed" (red, compact) and "open" (green, expanded).',
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
        'trigger() names the animation — you bind it to a template element with [@doorState]. ' +
        'state() captures what each state looks like (its CSS snapshot). transition() says when to ' +
        'animate — the "closed <=> open" shorthand means both directions. animate() controls the ' +
        'duration and easing. Notice that the animation lives in the component metadata, right next ' +
        'to the template. The logic stays close to the view it affects.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Sometimes elements appear and disappear entirely — an alert shows up, a toast fades out. ' +
        'Angular provides :enter and :leave aliases for exactly this. No named states needed.',
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
        ':enter fires when an element is inserted into the DOM (via @if, @for, etc.) and :leave ' +
        'fires when it is removed. The enter transition starts from an invisible, offset state and ' +
        'animates to the final position. The leave transition animates out before Angular actually ' +
        'removes the element. Without this, the alert would just pop in and vanish — no visual cue ' +
        'for the user about what happened or where to look.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Animations are not decoration. They communicate state changes to the user — what appeared, ' +
        'what disappeared, what moved. A well-animated UI feels responsive. A unanimated one feels broken.',
      conceptTitle: 'Angular Animations: Making State Changes Visible',
      conceptBody:
        'The animation API has four building blocks: trigger() names the animation and binds it to ' +
        'the template, state() captures CSS snapshots, transition() defines when to animate, and ' +
        'animate() controls timing and easing. Use :enter and :leave for elements that appear and ' +
        'disappear. Enable the whole system with provideAnimations() in your app config — without it, ' +
        'Angular silently ignores all animation metadata.',
      keyPoints: [
        'Animations communicate state changes — they tell the user what appeared, disappeared, or moved, without requiring them to hunt for changes',
        ':enter and :leave handle the most common case (conditional elements) without needing named states',
        'The "closed <=> open" shorthand covers both directions in a single transition declaration',
        'provideAnimations() in your app config activates the system — forget it and nothing animates, with no error',
      ],
    },
  ],
  completionCriteria: {
    description: 'Visual feedback systems live!',
    minStepsViewed: 4,
  },
};
