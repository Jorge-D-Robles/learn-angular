# Backlog

## P0 -- Setup & Design

### T-2026-037
- Title: Investigate Angular 21 Vite dev server routing bug
- Status: todo
- Assigned: human
- Priority: medium
- Size: S
- Milestone: P0
- Depends: —
- Blocked-by: —
- Tags: bug, investigation, angular, vite, routing
- Refs: playwright.config.ts

Angular 21's Vite-based dev server (`ng serve` in development mode) has a bug where the Router's `ROUTES` multi-provider is not populated — `router.config` is an empty array at runtime, causing no route components to render. The production build and `ng serve --configuration production` both work correctly. This is an Angular 21 / Vite dev server regression, not a project configuration issue.

Current workaround: e2e tests use `ng serve --configuration production` in `playwright.config.ts`.

Acceptance criteria:
- [ ] Root cause identified (Angular issue tracker link if available)
- [ ] Determine if this is a known Angular 21 bug or a project config issue
- [ ] If fixable: apply fix and update playwright.config.ts to use plain `ng serve`
- [ ] If not fixable: document the workaround and link to the upstream issue


---

## P1 -- Core Engine

### T-2026-558
- Title: Add CodeChallengeStep type and CodeChallengeValidationService
- Status: in-progress
- Assigned: claude
- Started: 2026-03-27
- Priority: high
- Size: M
- Milestone: P1
- Depends: —
- Blocked-by: —
- Tags: code-challenge, types, service, core
- Refs: src/app/core/curriculum/story-mission-content.types.ts, docs/architecture.md

Add a new `code-challenge` step type to the mission system and a validation service that checks learner-submitted code against structural rules.

**CodeChallengeStep type** — extends MissionStep union:
- `stepType: 'code-challenge'`
- `prompt`: instruction text telling the learner what to write
- `starterCode`: pre-filled code to start from
- `language`: 'typescript' | 'html' (for syntax highlighting)
- `validationRules`: array of ValidationRule objects
- `hints`: optional progressive hints
- `successMessage`: shown on correct submission
- `explanation`: shown after success to reinforce why the answer works

**ValidationRule** — structural matching (not AST, not eval):
- `type`: 'contains' | 'pattern' | 'notContains' | 'lineCount' | 'order'
- `contains`: checks substring exists (case-sensitive or not)
- `pattern`: regex match against full code or specific lines
- `notContains`: ensures anti-patterns are absent
- `lineCount`: min/max line count
- `order`: checks that patterns appear in correct order
- Each rule has an `errorMessage` shown when it fails

**CodeChallengeValidationService:**
- `validateCode(code: string, rules: ValidationRule[]): ValidationResult`
- `ValidationResult`: `{ valid: boolean; errors: string[]; passedRules: number; totalRules: number }`
- Rules evaluated sequentially; all errors collected (not short-circuit)

Acceptance criteria:
- [ ] CodeChallengeStep type added to MissionStep union
- [ ] ValidationRule and ValidationResult types defined
- [ ] CodeChallengeValidationService passes all validation rule types
- [ ] Unit tests cover every rule type with positive and negative cases
- [ ] Exported from appropriate barrels

### T-2026-559
- Title: Create CodeChallengeComponent with editor, prompt, and feedback
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-558
- Blocked-by: —
- Tags: code-challenge, component, ui
- Refs: src/app/shared/components/code-editor/code-editor.ts

Create the `nx-code-challenge` component that renders a code editing experience with prompt, submit, and feedback.

**Inputs:**
- `challenge: CodeChallengeStep` — the challenge definition
- `challengeIndex: number` — for tracking (which challenge in the mission)

**Outputs:**
- `challengeCompleted: output<void>` — emitted when learner solves it

**UI Layout:**
- Prompt text at top (rendered as HTML from challenge.prompt)
- CodeEditorComponent in editable mode with challenge.starterCode
- "Check Code" submit button
- Feedback area: validation errors (red) or success message (green)
- Progressive hint button: "Show Hint (X remaining)" — reveals one hint at a time
- After success: explanation panel shown below (similar to concept panel style)

**States:**
- `editing` — learner is writing code
- `checking` — validation running (brief, for UX feedback)
- `failed` — show errors, allow retry
- `passed` — show success + explanation, emit completion

**Behavior:**
- Submit runs CodeChallengeValidationService.validateCode()
- Failed attempts increment counter (shown: "Attempt 2")
- After 2 failures, hint button appears (if hints available)
- On pass, code editor becomes read-only, success animation plays
- Track attempts count for potential scoring integration later

Acceptance criteria:
- [ ] Component renders prompt, editor, submit button
- [ ] Validation feedback shows errors and success states
- [ ] Hint system reveals progressively
- [ ] Passed state shows explanation and emits event
- [ ] Accessible: proper ARIA labels, keyboard submit (Ctrl+Enter)
- [ ] Unit tests for all states and transitions

### T-2026-560
- Title: Integrate code-challenge step into MissionPage
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P1
- Depends: T-2026-559
- Blocked-by: —
- Tags: code-challenge, mission, integration
- Refs: src/app/pages/mission/mission.ts, src/app/pages/mission/mission.scss

Wire the CodeChallengeComponent into the MissionPage so `code-challenge` steps render inline with other step types.

**Changes to mission.ts:**
- Import CodeChallengeComponent
- Add computed signal: `codeChallenge` — casts currentStepData to CodeChallengeStep (or null)
- Add template block: `@if (codeChallenge()) { <nx-code-challenge ...> }`
- Handle `challengeCompleted` event: mark step as viewed + auto-advance if desired
- Track challenge completion separately from step viewing (challenges require solving, not just viewing)

**Changes to mission.scss:**
- Add `.mission__challenge` wrapper styles consistent with existing step styles
- Ensure code editor width matches the 72ch content width

**Changes to completion logic:**
- Code challenge steps count toward `minStepsViewed` only when solved (not just viewed)
- Update `canComplete` logic to account for unsolved challenges

Acceptance criteria:
- [ ] Code challenge steps render in mission flow
- [ ] Challenge completion gates mission progress
- [ ] Styles match existing mission aesthetic
- [ ] Navigation between steps works (prev/next with challenges)
- [ ] Integration test: mission with challenge step requires solving to complete

---

## P2 -- Foundations Bundle

### T-2026-561
- Title: Code challenges for Phase 1 chapters 1-5
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-560
- Blocked-by: —
- Tags: code-challenge, content, phase-1
- Refs: src/app/data/missions/phase-1/

Add 1-2 code challenges per chapter for chapters 1-5. Each challenge requires the learner to write real Angular code that demonstrates the chapter's concept.

**Chapter 1 (Components):** Write a @Component decorator with selector, template, and class
**Chapter 2 (Interpolation):** Write a component that displays class properties using {{ }}
**Chapter 3 (Composition):** Write a parent component that imports and uses a child component
**Chapter 4 (Control Flow):** Write template using @if, @for, and/or @switch
**Chapter 5 (Property Binding):** Write template with [disabled], [src], [class.active] bindings

Each challenge must include:
- Clear prompt in station narrative voice
- Starter code with TODOs marking where to write
- 3-6 validation rules that check structure (not exact string match)
- 1-2 progressive hints
- Success message reinforcing the concept
- Explanation connecting game action to real Angular usage

Acceptance criteria:
- [ ] 7-10 total challenges across 5 chapters
- [ ] Each challenge validates actual Angular code patterns
- [ ] Starter code is realistic and well-structured
- [ ] Hints guide without giving away the answer
- [ ] All challenges pass validation when correct code is entered
- [ ] Tests verify challenge data integrity (all required fields present)

### T-2026-562
- Title: Code challenges for Phase 1 chapters 6-10
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-560
- Blocked-by: —
- Tags: code-challenge, content, phase-1
- Refs: src/app/data/missions/phase-1/

Add 1-2 code challenges per chapter for chapters 6-10.

**Chapter 6 (Event Binding):** Write (click) and (keyup) handlers with $event
**Chapter 7 (Input):** Write a component with input() and input.required<T>()
**Chapter 8 (Output):** Write a component with output<T>() and .emit()
**Chapter 9 (Defer):** Write @defer blocks with triggers and companion blocks
**Chapter 10 (NgOptimizedImage):** Write template with ngSrc, width, height, priority

Same quality criteria as T-2026-561.

Acceptance criteria:
- [ ] 7-10 total challenges across 5 chapters
- [ ] Each challenge validates actual Angular code patterns
- [ ] Tests verify challenge data integrity

---

## P3 -- Navigation Bundle

### T-2026-563
- Title: Code challenges for Phase 2 chapters 11-13
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P3
- Depends: T-2026-560
- Blocked-by: —
- Tags: code-challenge, content, phase-2
- Refs: src/app/data/missions/phase-2/

Add 1-2 code challenges per chapter for chapters 11-13.

**Chapter 11 (Routing Basics):** Write a Routes array with provideRouter and router-outlet
**Chapter 12 (Route Config):** Write routes with parameters, redirects, wildcards, child routes
**Chapter 13 (Navigation):** Write routerLink usage and Router.navigate() calls

Same quality criteria as T-2026-561.

Acceptance criteria:
- [ ] 4-6 total challenges across 3 chapters
- [ ] Tests verify challenge data integrity

---

## P4 -- Forms Bundle

### T-2026-564
- Title: Code challenges for Phase 3 chapters 14-17
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P4
- Depends: T-2026-560
- Blocked-by: —
- Tags: code-challenge, content, phase-3
- Refs: src/app/data/missions/phase-3/

Add 1-2 code challenges per chapter for chapters 14-17.

**Chapter 14 (Template-Driven Forms):** Write a form with FormsModule, ngModel, ngSubmit
**Chapter 15 (Reading Form Values):** Write two-way binding with split ngModel/ngModelChange
**Chapter 16 (Reactive Forms):** Write FormBuilder.group() with FormGroup and FormArray
**Chapter 17 (Form Validation):** Write Validators (required, pattern) and a custom ValidatorFn

Same quality criteria as T-2026-561.

Acceptance criteria:
- [ ] 5-8 total challenges across 4 chapters
- [ ] Tests verify challenge data integrity

---

## P5 -- Architecture Bundle

### T-2026-565
- Title: Code challenges for Phase 4 chapters 18-19
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-560
- Blocked-by: —
- Tags: code-challenge, content, phase-4
- Refs: src/app/data/missions/phase-4/

Add 1-2 code challenges per chapter for chapters 18-19.

**Chapter 18 (Services):** Write an @Injectable service with providedIn: 'root' and inject() usage
**Chapter 19 (DI):** Write component-level providers and hierarchical injection

Same quality criteria as T-2026-561.

Acceptance criteria:
- [ ] 3-4 total challenges across 2 chapters
- [ ] Tests verify challenge data integrity

---

## P6 -- Signals Bundle

### T-2026-566
- Title: Code challenges for Phase 5 chapters 20-22
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P6
- Depends: T-2026-560
- Blocked-by: —
- Tags: code-challenge, content, phase-5
- Refs: src/app/data/missions/phase-5/

Add 1-2 code challenges per chapter for chapters 20-22.

**Chapter 20 (Built-in Pipes):** Write templates using | uppercase, | date, | currency, | async
**Chapter 21 (Pipe Parameters):** Write pipes with arguments: | date:'fullDate', | slice:0:5
**Chapter 22 (Custom Pipes):** Write a @Pipe class with transform() method

Same quality criteria as T-2026-561.

Acceptance criteria:
- [ ] 4-6 total challenges across 3 chapters
- [ ] Tests verify challenge data integrity

### T-2026-567
- Title: Code challenges for Phase 6 chapters 23-26
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P6
- Depends: T-2026-560
- Blocked-by: —
- Tags: code-challenge, content, phase-6
- Refs: src/app/data/missions/phase-6/

Add 1-2 code challenges per chapter for chapters 23-26.

**Chapter 23 (Signals):** Write signal(), computed(), and effect() declarations
**Chapter 24 (Signal Updates):** Write .set(), .update(), and signal-based component state
**Chapter 25 (Linked Signals):** Write linkedSignal() and resource() declarations
**Chapter 26 (RxJS Interop):** Write toSignal(), toObservable(), and rxResource()

Same quality criteria as T-2026-561.

Acceptance criteria:
- [ ] 5-8 total challenges across 4 chapters
- [ ] Tests verify challenge data integrity

---

## P7 -- Advanced Bundle

---

## P8 -- Polish & Replayability

