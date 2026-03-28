import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_29_CONTENT: StoryMissionContent = {
  chapterId: 29,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Components handle UI. But what about reusable behavior — highlighting on hover, restricting ' +
        'access based on roles, auto-resizing elements? You could copy-paste that logic into every ' +
        'component that needs it, but that\'s a maintenance nightmare. Directives are like browser ' +
        'extensions for your elements: they attach extra behavior without changing what the element is. ' +
        'Write the logic once, apply it anywhere with a single attribute.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Create an attribute directive that highlights an element on hover. This is the simplest kind of ' +
        'directive — it modifies appearance without touching the DOM structure.',
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
        'The bracket selector [appHighlight] means "match any element with this attribute." ' +
        '@HostListener hooks into DOM events on that element. ElementRef gives you direct access to the ' +
        'underlying DOM node. This is an attribute directive — it changes how an element looks or ' +
        'behaves, without adding or removing elements from the page.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Attribute directives change existing elements. Structural directives go further — they add or ' +
        'remove elements from the DOM entirely. Here\'s a custom one that conditionally renders content ' +
        'based on a clearance level, similar to @if but with domain-specific logic.',
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
        'Structural directives work with two pieces: TemplateRef holds the template that might be ' +
        'rendered, and ViewContainerRef controls the spot in the DOM where it appears. The @Input ' +
        'setter fires whenever the bound value changes, so the directive can dynamically add or remove ' +
        'content. The asterisk (*) in the usage is syntactic sugar — Angular rewraps the element in ' +
        'an ng-template behind the scenes.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Directives give you a clean way to share behavior across components without inheritance or ' +
        'copy-pasting. One attribute, one behavior, applied anywhere.',
      conceptTitle: 'Custom Directives — Reusable Behavior, Extracted',
      conceptBody:
        'There are two kinds. Attribute directives modify how an existing element looks or behaves — ' +
        'think hover effects, auto-focus, tooltip logic. Structural directives add or remove elements ' +
        'from the DOM — think access control, feature flags, conditional rendering. Both use @Directive ' +
        'with an attribute selector. The key difference: structural directives inject TemplateRef and ' +
        'ViewContainerRef to manipulate DOM structure.',
      keyPoints: [
        'Attribute directives change behavior/appearance — @HostListener for events, ElementRef for DOM access',
        'Structural directives add/remove elements — TemplateRef + ViewContainerRef do the heavy lifting',
        'Both use @Directive with a bracket selector like [appHighlight]',
        'Directives keep components focused on their own job by extracting cross-cutting concerns',
      ],
    },
  ],
  completionCriteria: {
    description: 'Behavior protocols active!',
    minStepsViewed: 4,
  },
};
