import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_29_CONTENT: StoryMissionContent = {
  chapterId: 29,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Station modules share common behaviors — highlight on hover, restrict access based on clearance ' +
        'level, auto-resize to fit their container. Duplicating this logic in every component is wasteful ' +
        'and error-prone. Angular custom directives let you encapsulate reusable behavior and attach it to ' +
        'any element with a single attribute, keeping components focused on their primary responsibility.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create an attribute directive that changes an element\'s appearance on hover, simulating a ' +
        'station module highlight protocol.',
      code: [
        "import { Directive, ElementRef, HostListener } from '@angular/core';",
        '',
        '@Directive({',
        "  selector: '[appHighlight]',",
        '})',
        'export class HighlightDirective {',
        '  constructor(private el: ElementRef) {}',
        '',
        "  @HostListener('mouseenter')",
        '  onMouseEnter() {',
        "    this.el.nativeElement.style.backgroundColor = '#1a3a5c';",
        '  }',
        '',
        "  @HostListener('mouseleave')",
        '  onMouseLeave() {',
        "    this.el.nativeElement.style.backgroundColor = '';",
        '  }',
        '}',
        '',
        '// Usage: <div appHighlight>Hover to highlight</div>',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 3, 4, 9, 14],
      explanation:
        '@Directive marks a class as an Angular directive. The selector \'[appHighlight]\' matches any ' +
        'element with the appHighlight attribute. @HostListener binds to DOM events on the host element. ' +
        'ElementRef provides direct access to the underlying DOM element. This is an attribute directive — ' +
        'it modifies behavior or appearance without changing the DOM structure.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create a structural directive that conditionally renders content based on crew clearance ' +
        'level, similar to *ngIf but with domain-specific logic.',
      code: [
        "import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';",
        '',
        '@Directive({',
        "  selector: '[appClearance]',",
        '})',
        'export class ClearanceDirective {',
        '  private hasView = false;',
        '',
        '  constructor(',
        '    private templateRef: TemplateRef<unknown>,',
        '    private viewContainer: ViewContainerRef,',
        '  ) {}',
        '',
        '  @Input() set appClearance(requiredLevel: number) {',
        '    const crewLevel = 3; // would come from a service',
        '    if (crewLevel >= requiredLevel && !this.hasView) {',
        '      this.viewContainer.createEmbeddedView(this.templateRef);',
        '      this.hasView = true;',
        '    } else if (crewLevel < requiredLevel && this.hasView) {',
        '      this.viewContainer.clear();',
        '      this.hasView = false;',
        '    }',
        '  }',
        '}',
        '',
        '// Usage: <div *appClearance="2">Restricted content</div>',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 3, 4, 10, 11, 14, 17],
      explanation:
        'Structural directives manipulate the DOM by adding or removing elements. TemplateRef holds the ' +
        'template content, and ViewContainerRef controls where it is rendered. The @Input setter runs ' +
        'whenever the bound value changes, letting the directive dynamically show or hide content. The ' +
        'asterisk (*) syntax is shorthand that wraps the element in an ng-template.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Behavior protocols are active. Here is how custom directives encapsulate reusable behavior.',
      conceptTitle: 'Custom Directives — Attribute and Structural',
      conceptBody:
        'Attribute directives modify the appearance or behavior of an existing element without changing ' +
        'DOM structure. Structural directives add or remove elements from the DOM. Use @Directive with ' +
        'an attribute selector, @HostListener for events, ElementRef for DOM access, and TemplateRef ' +
        'with ViewContainerRef for structural manipulation.',
      keyPoints: [
        'Attribute directives change appearance/behavior — use ElementRef and @HostListener',
        'Structural directives add/remove DOM elements — use TemplateRef and ViewContainerRef',
        '@Directive({ selector: "[name]" }) registers an attribute directive',
        'Directives keep components lean by extracting cross-cutting behavior',
      ],
    },
  ],
  completionCriteria: {
    description: 'Behavior protocols active!',
    minStepsViewed: 4,
  },
};
