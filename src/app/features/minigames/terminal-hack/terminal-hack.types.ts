// ---------------------------------------------------------------------------
// Canonical domain model types for Terminal Hack minigame
// ---------------------------------------------------------------------------

/** Form element types that can appear in a target form. */
export type FormElementType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date';

/** Angular form tools/APIs available to the player at each level. */
export type FormToolType =
  | 'ngModel'
  | 'ngSubmit'
  | 'FormControl'
  | 'FormGroup'
  | 'FormArray'
  | 'FormBuilder'
  | 'Validators.required'
  | 'Validators.email'
  | 'Validators.pattern'
  | 'Validators.min'
  | 'Validators.max'
  | 'Validators.minLength'
  | 'Validators.maxLength'
  | 'customValidator'
  | 'asyncValidator'
  | 'crossFieldValidator';

/**
 * Validation rule for a form element.
 *
 * For the `pattern` type, `params` is the regex pattern stored as a string
 * (e.g., `'^[A-Za-z]+$'`). The engine will construct a RegExp from it at
 * runtime.
 */
export interface FormValidationRule {
  readonly type: 'required' | 'email' | 'pattern' | 'min' | 'max' | 'minLength' | 'maxLength' | 'custom';
  readonly params?: string | number;
  readonly errorMessage: string;
}

/** A single form element in the target form spec. */
export interface FormElementSpec {
  readonly id: string;
  readonly elementType: FormElementType;
  readonly label: string;
  readonly name: string;
  readonly validations: readonly FormValidationRule[];
  readonly options?: readonly string[]; // For select/radio elements
  readonly defaultValue?: string;
  readonly groupName?: string; // For nested FormGroup grouping
}

/** The target form specification the player must rebuild. */
export interface TargetFormSpec {
  readonly formName: string;
  readonly elements: readonly FormElementSpec[];
  readonly submitAction: string;
  readonly formType: 'template-driven' | 'reactive';
}

/** A test case with inputs and expected validation state. */
export interface FormTestCase {
  readonly id: string;
  readonly description: string;
  readonly inputValues: Readonly<Record<string, string>>;
  readonly expectedValid: boolean;
  readonly expectedErrors?: Readonly<Record<string, readonly string[]>>;
}

/** A progressive hint. */
export interface FormHint {
  readonly order: number;
  readonly text: string;
}

// ---------------------------------------------------------------------------
// Shared tool constant sets
// ---------------------------------------------------------------------------

/** Template-driven form tools. */
export const TEMPLATE_DRIVEN_TOOLS: ReadonlySet<FormToolType> = new Set(['ngModel', 'ngSubmit']);

/** Reactive form tools. */
export const REACTIVE_TOOLS: ReadonlySet<FormToolType> = new Set([
  'FormControl', 'FormGroup', 'FormArray', 'FormBuilder',
]);

/** Validator tools (valid for both form types). */
export const VALIDATOR_TOOLS: ReadonlySet<FormToolType> = new Set([
  'Validators.required', 'Validators.email', 'Validators.pattern',
  'Validators.min', 'Validators.max', 'Validators.minLength', 'Validators.maxLength',
  'customValidator', 'asyncValidator', 'crossFieldValidator',
]);

// ---------------------------------------------------------------------------
// Level data
// ---------------------------------------------------------------------------

/** Game-specific level data for Terminal Hack. */
export interface TerminalHackLevelData {
  readonly targetFormSpec: TargetFormSpec;
  readonly testCases: readonly FormTestCase[];
  readonly availableElements: readonly FormToolType[];
  readonly timeLimit: number; // seconds
  readonly hints: readonly FormHint[];
}
