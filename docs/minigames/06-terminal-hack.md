# Minigame: Terminal Hack

## Summary

| Field               | Value                                            |
| ------------------- | ------------------------------------------------ |
| Number              | 06                                               |
| Angular Topic       | Forms (template-driven and reactive)             |
| Curriculum Chapters | Ch 14-17 (Forms Introduction through Validation) |
| Core Mechanic       | Timed form reconstruction                        |
| Difficulty Tiers    | Basic / Intermediate / Advanced / Boss           |
| Total Levels        | 21                                               |

## Concept

The player is a hacker rebuilding broken crew terminal interfaces. Each level presents a damaged form that must be reconstructed with the correct controls, bindings, validation rules, and submission logic. A reference screenshot shows the target form; the player builds it using a form code editor.

## Station Narrative

The station's **Crew Terminals** were corrupted by the meteor impact. Each terminal handles critical input — crew reports, engineering diagnostics, access requests. The player must restore each terminal by rebuilding its form logic.

## Gameplay

### Core Mechanic

- Left panel: target form preview (what the rebuilt form should look like and do)
- Right panel: form code editor where the player writes/edits the form code
- Live preview updates as the player types
- Test inputs are provided — the form must handle them correctly
- Timer adds urgency (generous at first, tighter in advanced levels)

### Controls

- **Code editor** — type form code (template + component class)
- **Test button** — run predefined test inputs against the form
- **Submit button** — finalize and score the form
- **Hint button** — reveals one element (costs points)

### Win/Lose Conditions

- **Win:** Form passes all test inputs and matches target behavior
- **Lose:** Timer expires, or form fails more than 3 test cases
- **Scoring:** Speed + test pass rate + no hints used = perfect

## Level Progression

### Basic Tier (Levels 1-7)

| Level | Concept Introduced   | Description                                    |
| ----- | -------------------- | ---------------------------------------------- |
| 1     | Text input           | Single text input with ngModel                 |
| 2     | Multiple inputs      | Name + email + message fields                  |
| 3     | Select dropdown      | Dropdown with predefined options               |
| 4     | Checkbox/radio       | Boolean and multi-choice inputs                |
| 5     | Form submission      | (ngSubmit) handler and form data access        |
| 6     | Two-way binding      | Display form values in real-time preview       |
| 7     | Template-driven form | Complete template-driven form with FormsModule |

### Intermediate Tier (Levels 8-14)

| Level | Concept Introduced  | Description                                          |
| ----- | ------------------- | ---------------------------------------------------- |
| 8     | FormControl         | Single reactive form control                         |
| 9     | FormGroup           | Group multiple controls                              |
| 10    | FormBuilder         | Build forms with fb.group() shorthand                |
| 11    | Required validation | Validators.required                                  |
| 12    | Pattern validation  | Validators.pattern, Validators.email                 |
| 13    | Min/max validation  | Validators.min, Validators.max, Validators.minLength |
| 14    | Error messages      | Display validation errors conditionally              |

### Advanced Tier (Levels 15-20)

| Level | Concept Introduced     | Description                                               |
| ----- | ---------------------- | --------------------------------------------------------- |
| 15    | Custom validators      | Write a custom validator function                         |
| 16    | Cross-field validation | Validator that compares two fields (e.g., password match) |
| 17    | Async validators       | Validator that checks against a simulated API             |
| 18    | Dynamic form controls  | Add/remove controls based on user selection               |
| 19    | FormArray              | Dynamic list of form groups                               |
| 20    | Nested FormGroups      | Address sub-form within a larger form                     |

### Boss Level (Level 21)

**"Engineering Diagnostic Terminal"** — Rebuild a complex diagnostic terminal with: nested form groups, form arrays, custom validators, async validation, dynamic controls, conditional sections, and real-time preview. Must pass 15 test scenarios including edge cases. Time limit: 5 minutes.

## Angular Concepts Covered

1. Template-driven forms (ngModel, FormsModule)
2. Form submission (ngSubmit)
3. Reactive forms (FormControl, FormGroup, FormArray)
4. FormBuilder
5. Built-in validators (required, email, min, max, minLength, maxLength, pattern)
6. Validation error display
7. Custom validators
8. Cross-field validators
9. Async validators
10. Dynamic form controls
11. Nested form groups
12. Form value/status observables

## Replay Modes

### Endless Mode

Procedurally generated form requirements with increasing complexity. Build forms until you fail 3 test cases.

### Speed Run

Fixed set of 8 forms. Par time: 8 minutes.

### Daily Challenge

Themed terminal rebuild (e.g., "Today: rebuild the crew medical intake form with validation").

## Visual Design

- Retro terminal/hacker aesthetic — green-on-black code, scanlines
- Target form preview is a clean UI mockup
- Live preview shows the form taking shape as player types
- Test execution: inputs animate into form fields, pass/fail indicators appear
- Timer is a power gauge depleting at the top
- Completion: terminal "reboots" with success animation

## Technical Notes

- Code editor is a simplified Angular-aware editor (syntax highlighting, basic autocomplete)
- Test cases are predefined input/output pairs per level
- Form validation is checked by actually running Angular form logic
- Levels define: target form spec, test cases, available form elements, time limit
