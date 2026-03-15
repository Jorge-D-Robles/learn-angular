import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  TerminalHackLevelData,
  FormElementSpec,
  FormValidationRule,
  FormTestCase,
  FormHint,
  FormElementType,
} from '../../features/minigames/terminal-hack/terminal-hack.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a FormElementSpec. */
function element(
  id: string,
  elementType: FormElementType,
  label: string,
  name: string,
  validations: readonly FormValidationRule[] = [],
  options?: readonly string[],
  defaultValue?: string,
  groupName?: string,
): FormElementSpec {
  const el: FormElementSpec = { id, elementType, label, name, validations };
  if (options) return { ...el, options };
  if (defaultValue !== undefined) return { ...el, defaultValue };
  if (groupName) return { ...el, groupName };
  return el;
}

/** Build a FormElementSpec with all optional fields. */
function elementFull(
  id: string,
  elementType: FormElementType,
  label: string,
  name: string,
  validations: readonly FormValidationRule[],
  opts: { options?: readonly string[]; defaultValue?: string; groupName?: string },
): FormElementSpec {
  const base: FormElementSpec = { id, elementType, label, name, validations };
  return {
    ...base,
    ...(opts.options ? { options: opts.options } : {}),
    ...(opts.defaultValue !== undefined ? { defaultValue: opts.defaultValue } : {}),
    ...(opts.groupName ? { groupName: opts.groupName } : {}),
  };
}

/** Build a FormValidationRule. */
function validation(
  type: FormValidationRule['type'],
  errorMessage: string,
  params?: string | number,
): FormValidationRule {
  const rule: FormValidationRule = { type, errorMessage };
  return params !== undefined ? { ...rule, params } : rule;
}

/** Build a FormTestCase. */
function testCase(
  id: string,
  description: string,
  inputValues: Record<string, string>,
  expectedValid: boolean,
  expectedErrors?: Record<string, string[]>,
): FormTestCase {
  const tc: FormTestCase = { id, description, inputValues, expectedValid };
  return expectedErrors ? { ...tc, expectedErrors } : tc;
}

/** Build a FormHint. */
function hint(order: number, text: string): FormHint {
  return { order, text };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const TERMINAL_HACK_LEVELS: readonly LevelDefinition<TerminalHackLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-7) — Template-driven forms
  // =========================================================================

  // Level 1 — Text input
  {
    levelId: 'th-basic-01',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Crew Name Entry',
    conceptIntroduced: 'Text input',
    description: 'Rebuild a single text input terminal for crew name entry using ngModel.',
    data: {
      targetFormSpec: {
        formName: 'crewNameForm',
        elements: [
          element('name', 'text', 'Crew Name', 'crewName'),
        ],
        submitAction: 'Register crew name',
        formType: 'template-driven',
      },
      testCases: [
        testCase('tc1', 'Valid name entry', { crewName: 'Nova' }, true),
        testCase('tc2', 'Empty name entry', { crewName: '' }, true),
      ],
      availableElements: ['ngModel'],
      timeLimit: 120,
      hints: [
        hint(1, 'Use [(ngModel)] for two-way binding on the input.'),
        hint(2, 'The input element needs a name attribute matching the field name.'),
      ],
    },
  },

  // Level 2 — Multiple inputs
  {
    levelId: 'th-basic-02',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Crew Contact Form',
    conceptIntroduced: 'Multiple inputs',
    description: 'Build a contact form with name, email, and message fields.',
    data: {
      targetFormSpec: {
        formName: 'crewContactForm',
        elements: [
          element('name', 'text', 'Full Name', 'fullName'),
          element('email', 'email', 'Email Address', 'email'),
          element('message', 'textarea', 'Message', 'message'),
        ],
        submitAction: 'Submit crew contact report',
        formType: 'template-driven',
      },
      testCases: [
        testCase('tc1', 'All fields filled', { fullName: 'Captain Nova', email: 'nova@nexus.io', message: 'Status report' }, true),
        testCase('tc2', 'Only name filled', { fullName: 'Nova', email: '', message: '' }, true),
      ],
      availableElements: ['ngModel'],
      timeLimit: 120,
      hints: [
        hint(1, 'Each input needs its own [(ngModel)] binding.'),
        hint(2, 'Use a <textarea> element for the message field.'),
      ],
    },
  },

  // Level 3 — Select dropdown
  {
    levelId: 'th-basic-03',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Department Selector',
    conceptIntroduced: 'Select dropdown',
    description: 'Build a dropdown to select the crew department assignment.',
    data: {
      targetFormSpec: {
        formName: 'departmentForm',
        elements: [
          elementFull('dept', 'select', 'Department', 'department', [], {
            options: ['Engineering', 'Science', 'Medical', 'Command', 'Security'],
          }),
        ],
        submitAction: 'Assign department',
        formType: 'template-driven',
      },
      testCases: [
        testCase('tc1', 'Select Engineering', { department: 'Engineering' }, true),
        testCase('tc2', 'Select Medical', { department: 'Medical' }, true),
      ],
      availableElements: ['ngModel'],
      timeLimit: 120,
      hints: [
        hint(1, 'Use a <select> element with <option> children.'),
        hint(2, 'Bind [(ngModel)] to the select element for the selected value.'),
      ],
    },
  },

  // Level 4 — Checkbox/radio
  {
    levelId: 'th-basic-04',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Access Permissions',
    conceptIntroduced: 'Checkbox/radio',
    description: 'Build a permissions form with checkboxes and radio buttons for access levels.',
    data: {
      targetFormSpec: {
        formName: 'permissionsForm',
        elements: [
          element('admin', 'checkbox', 'Admin Access', 'adminAccess'),
          elementFull('clearance', 'radio', 'Clearance Level', 'clearanceLevel', [], {
            options: ['Basic', 'Standard', 'Elevated', 'Maximum'],
          }),
        ],
        submitAction: 'Set permissions',
        formType: 'template-driven',
      },
      testCases: [
        testCase('tc1', 'Admin with Elevated clearance', { adminAccess: 'true', clearanceLevel: 'Elevated' }, true),
        testCase('tc2', 'No admin with Basic clearance', { adminAccess: 'false', clearanceLevel: 'Basic' }, true),
      ],
      availableElements: ['ngModel'],
      timeLimit: 120,
      hints: [
        hint(1, 'Use type="checkbox" for boolean inputs.'),
        hint(2, 'Radio buttons share the same name attribute to form a group.'),
      ],
    },
  },

  // Level 5 — Form submission
  {
    levelId: 'th-basic-05',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Incident Report Submission',
    conceptIntroduced: 'Form submission',
    description: 'Wire up form submission with (ngSubmit) to send an incident report.',
    data: {
      targetFormSpec: {
        formName: 'incidentForm',
        elements: [
          element('title', 'text', 'Incident Title', 'incidentTitle'),
          elementFull('severity', 'select', 'Severity', 'severity', [], {
            options: ['Low', 'Medium', 'High', 'Critical'],
          }),
          element('details', 'textarea', 'Details', 'details'),
        ],
        submitAction: 'File incident report',
        formType: 'template-driven',
      },
      testCases: [
        testCase('tc1', 'Full incident report', { incidentTitle: 'Hull Breach', severity: 'Critical', details: 'Deck 7 compromised' }, true),
        testCase('tc2', 'Minimal report', { incidentTitle: 'Noise', severity: 'Low', details: '' }, true),
      ],
      availableElements: ['ngModel', 'ngSubmit'],
      timeLimit: 120,
      hints: [
        hint(1, 'Add (ngSubmit) to the <form> element.'),
        hint(2, 'Create a submit handler method in the component class.'),
      ],
    },
  },

  // Level 6 — Two-way binding
  {
    levelId: 'th-basic-06',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Live Status Display',
    conceptIntroduced: 'Two-way binding',
    description: 'Display form values in a real-time preview panel using two-way binding.',
    data: {
      targetFormSpec: {
        formName: 'statusForm',
        elements: [
          element('status', 'text', 'Status Message', 'statusMessage'),
          elementFull('priority', 'select', 'Priority', 'priority', [], {
            options: ['Normal', 'Urgent', 'Emergency'],
          }),
        ],
        submitAction: 'Broadcast status',
        formType: 'template-driven',
      },
      testCases: [
        testCase('tc1', 'Status with normal priority', { statusMessage: 'All systems nominal', priority: 'Normal' }, true),
        testCase('tc2', 'Emergency broadcast', { statusMessage: 'Reactor overheating', priority: 'Emergency' }, true),
      ],
      availableElements: ['ngModel'],
      timeLimit: 120,
      hints: [
        hint(1, 'Use {{ statusMessage }} interpolation to display the live value.'),
        hint(2, 'The preview panel should update as the user types — that is two-way binding.'),
      ],
    },
  },

  // Level 7 — Template-driven form
  {
    levelId: 'th-basic-07',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    order: 7,
    title: 'Crew Report Terminal',
    conceptIntroduced: 'Template-driven form',
    description: 'Build a complete template-driven crew report form with FormsModule.',
    data: {
      targetFormSpec: {
        formName: 'crewReportForm',
        elements: [
          element('name', 'text', 'Reporter Name', 'reporterName'),
          elementFull('dept', 'select', 'Department', 'department', [], {
            options: ['Engineering', 'Science', 'Medical', 'Command'],
          }),
          element('date', 'date', 'Report Date', 'reportDate'),
          element('summary', 'textarea', 'Summary', 'summary'),
          element('urgent', 'checkbox', 'Urgent', 'isUrgent'),
        ],
        submitAction: 'Submit crew report',
        formType: 'template-driven',
      },
      testCases: [
        testCase('tc1', 'Complete crew report', { reporterName: 'Lt. Pulse', department: 'Engineering', reportDate: '2024-03-15', summary: 'Reactor stable', isUrgent: 'false' }, true),
        testCase('tc2', 'Urgent report', { reporterName: 'Dr. Helix', department: 'Medical', reportDate: '2024-03-16', summary: 'Quarantine needed', isUrgent: 'true' }, true),
        testCase('tc3', 'Minimal report', { reporterName: 'Nova', department: 'Command', reportDate: '', summary: '', isUrgent: 'false' }, true),
      ],
      availableElements: ['ngModel', 'ngSubmit'],
      timeLimit: 120,
      hints: [
        hint(1, 'Import FormsModule in your component imports.'),
        hint(2, 'Use #form="ngForm" on the <form> element for template reference.'),
        hint(3, 'Every input needs both name and [(ngModel)] attributes.'),
      ],
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 8-14) — Reactive forms
  // =========================================================================

  // Level 8 — FormControl
  {
    levelId: 'th-intermediate-01',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Sensor Reading Input',
    conceptIntroduced: 'FormControl',
    description: 'Create a single reactive FormControl for a sensor reading input.',
    data: {
      targetFormSpec: {
        formName: 'sensorForm',
        elements: [
          element('reading', 'number', 'Sensor Reading', 'sensorReading'),
        ],
        submitAction: 'Log sensor reading',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Valid reading', { sensorReading: '42.5' }, true),
        testCase('tc2', 'Empty reading', { sensorReading: '' }, true),
      ],
      availableElements: ['FormControl'],
      timeLimit: 90,
      hints: [
        hint(1, 'Use new FormControl() in the component class.'),
        hint(2, 'Bind the control to the input with [formControl]="sensorReading".'),
      ],
    },
  },

  // Level 9 — FormGroup
  {
    levelId: 'th-intermediate-02',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Navigation Coordinates',
    conceptIntroduced: 'FormGroup',
    description: 'Group coordinate inputs into a reactive FormGroup.',
    data: {
      targetFormSpec: {
        formName: 'coordsForm',
        elements: [
          element('x', 'number', 'X Coordinate', 'x'),
          element('y', 'number', 'Y Coordinate', 'y'),
          element('z', 'number', 'Z Coordinate', 'z'),
        ],
        submitAction: 'Set navigation coordinates',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Valid coordinates', { x: '100', y: '200', z: '50' }, true),
        testCase('tc2', 'Negative coordinates', { x: '-50', y: '0', z: '-100' }, true),
      ],
      availableElements: ['FormControl', 'FormGroup'],
      timeLimit: 90,
      hints: [
        hint(1, 'Use new FormGroup({ x: new FormControl(), ... }).'),
        hint(2, 'Bind the group to the form with [formGroup]="coordsForm".'),
      ],
    },
  },

  // Level 10 — FormBuilder
  {
    levelId: 'th-intermediate-03',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Diagnostics Shorthand',
    conceptIntroduced: 'FormBuilder',
    description: 'Use FormBuilder to quickly create a diagnostics form.',
    data: {
      targetFormSpec: {
        formName: 'diagnosticsForm',
        elements: [
          element('system', 'text', 'System Name', 'systemName'),
          element('code', 'text', 'Diagnostic Code', 'diagnosticCode'),
          element('notes', 'textarea', 'Notes', 'notes'),
        ],
        submitAction: 'Run diagnostics',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Full diagnostics entry', { systemName: 'Life Support', diagnosticCode: 'LS-042', notes: 'Nominal' }, true),
        testCase('tc2', 'Code only', { systemName: '', diagnosticCode: 'RX-001', notes: '' }, true),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder'],
      timeLimit: 90,
      hints: [
        hint(1, 'Inject FormBuilder in the constructor.'),
        hint(2, 'Use this.fb.group({ systemName: [\'\'], ... }) shorthand.'),
      ],
    },
  },

  // Level 11 — Required validation
  {
    levelId: 'th-intermediate-04',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Mandatory Fields Check',
    conceptIntroduced: 'Required validation',
    description: 'Add required validation to ensure critical fields are filled.',
    data: {
      targetFormSpec: {
        formName: 'mandatoryForm',
        elements: [
          element('id', 'text', 'Crew ID', 'crewId', [
            validation('required', 'Crew ID is required'),
          ]),
          element('name', 'text', 'Full Name', 'fullName', [
            validation('required', 'Full name is required'),
          ]),
          element('rank', 'text', 'Rank', 'rank'),
        ],
        submitAction: 'Verify crew identity',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'All required fields filled', { crewId: 'NX-001', fullName: 'Captain Nova', rank: 'Captain' }, true),
        testCase('tc2', 'Missing crew ID', { crewId: '', fullName: 'Captain Nova', rank: '' }, false, { crewId: ['required'] }),
        testCase('tc3', 'Missing full name', { crewId: 'NX-001', fullName: '', rank: '' }, false, { fullName: ['required'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required'],
      timeLimit: 90,
      hints: [
        hint(1, 'Add Validators.required as the second argument in fb.group().'),
        hint(2, 'Use fb.group({ crewId: [\'\', Validators.required] }).'),
      ],
    },
  },

  // Level 12 — Pattern validation
  {
    levelId: 'th-intermediate-05',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Comms Frequency Validator',
    conceptIntroduced: 'Pattern validation',
    description: 'Validate a communications frequency with pattern and email validators.',
    data: {
      targetFormSpec: {
        formName: 'commsForm',
        elements: [
          element('freq', 'text', 'Frequency Code', 'frequencyCode', [
            validation('required', 'Frequency code is required'),
            validation('pattern', 'Must be format: XX-000', '^[A-Z]{2}-\\d{3}$'),
          ]),
          element('contact', 'email', 'Contact Email', 'contactEmail', [
            validation('email', 'Must be a valid email'),
          ]),
        ],
        submitAction: 'Set comms frequency',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Valid frequency and email', { frequencyCode: 'NX-042', contactEmail: 'comms@nexus.io' }, true),
        testCase('tc2', 'Invalid frequency format', { frequencyCode: 'bad', contactEmail: 'comms@nexus.io' }, false, { frequencyCode: ['pattern'] }),
        testCase('tc3', 'Invalid email', { frequencyCode: 'NX-042', contactEmail: 'not-an-email' }, false, { contactEmail: ['email'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'Validators.email', 'Validators.pattern'],
      timeLimit: 90,
      hints: [
        hint(1, 'Use Validators.pattern(/^[A-Z]{2}-\\d{3}$/) for the frequency code.'),
        hint(2, 'Use Validators.email for the contact email field.'),
      ],
    },
  },

  // Level 13 — Min/max validation
  {
    levelId: 'th-intermediate-06',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Power Allocation Limits',
    conceptIntroduced: 'Min/max validation',
    description: 'Validate power allocation values are within safe operational limits.',
    data: {
      targetFormSpec: {
        formName: 'powerForm',
        elements: [
          element('output', 'number', 'Power Output (%)', 'powerOutput', [
            validation('required', 'Power output is required'),
            validation('min', 'Minimum output is 10%', 10),
            validation('max', 'Maximum output is 100%', 100),
          ]),
          element('label', 'text', 'System Label', 'systemLabel', [
            validation('required', 'System label is required'),
            validation('minLength', 'Label must be at least 3 characters', 3),
          ]),
        ],
        submitAction: 'Allocate power',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Valid allocation', { powerOutput: '75', systemLabel: 'Reactor' }, true),
        testCase('tc2', 'Output too low', { powerOutput: '5', systemLabel: 'Reactor' }, false, { powerOutput: ['min'] }),
        testCase('tc3', 'Output too high', { powerOutput: '150', systemLabel: 'Reactor' }, false, { powerOutput: ['max'] }),
        testCase('tc4', 'Label too short', { powerOutput: '50', systemLabel: 'RX' }, false, { systemLabel: ['minLength'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'Validators.min', 'Validators.max', 'Validators.minLength'],
      timeLimit: 90,
      hints: [
        hint(1, 'Use Validators.min(10) and Validators.max(100) for the power output.'),
        hint(2, 'Use Validators.minLength(3) for the system label.'),
      ],
    },
  },

  // Level 14 — Error messages
  {
    levelId: 'th-intermediate-07',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Intermediate,
    order: 7,
    title: 'Validation Error Display',
    conceptIntroduced: 'Error messages',
    description: 'Display validation error messages conditionally next to form fields.',
    data: {
      targetFormSpec: {
        formName: 'errorDisplayForm',
        elements: [
          element('username', 'text', 'Username', 'username', [
            validation('required', 'Username is required'),
            validation('minLength', 'Username must be at least 4 characters', 4),
          ]),
          element('accessCode', 'text', 'Access Code', 'accessCode', [
            validation('required', 'Access code is required'),
            validation('pattern', 'Must be 6 digits', '^\\d{6}$'),
          ]),
        ],
        submitAction: 'Authenticate',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Valid credentials', { username: 'nova_cpt', accessCode: '123456' }, true),
        testCase('tc2', 'Username too short', { username: 'no', accessCode: '123456' }, false, { username: ['minLength'] }),
        testCase('tc3', 'Invalid access code', { username: 'nova_cpt', accessCode: 'abc' }, false, { accessCode: ['pattern'] }),
        testCase('tc4', 'Both fields empty', { username: '', accessCode: '' }, false, { username: ['required'], accessCode: ['required'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'Validators.minLength', 'Validators.pattern'],
      timeLimit: 90,
      hints: [
        hint(1, 'Use *ngIf with control.hasError(\'required\') to show errors.'),
        hint(2, 'Check control.touched before showing errors to avoid premature display.'),
      ],
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 15-20) — Advanced form techniques
  // =========================================================================

  // Level 15 — Custom validators
  {
    levelId: 'th-advanced-01',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Secure Code Validator',
    conceptIntroduced: 'Custom validators',
    description: 'Write a custom validator function to enforce station security codes.',
    data: {
      targetFormSpec: {
        formName: 'securityCodeForm',
        elements: [
          element('code', 'text', 'Security Code', 'securityCode', [
            validation('required', 'Security code is required'),
            validation('custom', 'Code must start with NX- and end with a digit'),
          ]),
        ],
        submitAction: 'Verify security code',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Valid security code', { securityCode: 'NX-Alpha-7' }, true),
        testCase('tc2', 'Missing NX prefix', { securityCode: 'Alpha-7' }, false, { securityCode: ['custom'] }),
        testCase('tc3', 'Missing trailing digit', { securityCode: 'NX-Alpha' }, false, { securityCode: ['custom'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'customValidator'],
      timeLimit: 75,
      hints: [
        hint(1, 'A custom validator is a function that returns null (valid) or an error object.'),
        hint(2, 'Check value.startsWith(\'NX-\') and /\\d$/.test(value) in your validator.'),
      ],
    },
  },

  // Level 16 — Cross-field validation
  {
    levelId: 'th-advanced-02',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Password Match Gate',
    conceptIntroduced: 'Cross-field validation',
    description: 'Create a cross-field validator to ensure password and confirmation match.',
    data: {
      targetFormSpec: {
        formName: 'passwordForm',
        elements: [
          element('pass', 'password', 'New Password', 'password', [
            validation('required', 'Password is required'),
            validation('minLength', 'Password must be at least 8 characters', 8),
          ]),
          element('confirm', 'password', 'Confirm Password', 'confirmPassword', [
            validation('required', 'Confirmation is required'),
          ]),
        ],
        submitAction: 'Update access credentials',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Matching passwords', { password: 'Nexus2024!', confirmPassword: 'Nexus2024!' }, true),
        testCase('tc2', 'Mismatched passwords', { password: 'Nexus2024!', confirmPassword: 'WrongPass' }, false, { confirmPassword: ['custom'] }),
        testCase('tc3', 'Short password', { password: 'short', confirmPassword: 'short' }, false, { password: ['minLength'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'Validators.minLength', 'customValidator', 'crossFieldValidator'],
      timeLimit: 75,
      hints: [
        hint(1, 'A cross-field validator is applied to the FormGroup, not individual controls.'),
        hint(2, 'Compare group.get(\'password\').value === group.get(\'confirmPassword\').value.'),
      ],
    },
  },

  // Level 17 — Async validators
  {
    levelId: 'th-advanced-03',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Callsign Availability Check',
    conceptIntroduced: 'Async validators',
    description: 'Add an async validator that checks callsign availability against a simulated API.',
    data: {
      targetFormSpec: {
        formName: 'callsignForm',
        elements: [
          element('callsign', 'text', 'Callsign', 'callsign', [
            validation('required', 'Callsign is required'),
            validation('minLength', 'Callsign must be at least 3 characters', 3),
          ]),
        ],
        submitAction: 'Register callsign',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Available callsign', { callsign: 'Phoenix' }, true),
        testCase('tc2', 'Taken callsign', { callsign: 'Nova' }, false, { callsign: ['custom'] }),
        testCase('tc3', 'Too short callsign', { callsign: 'AB' }, false, { callsign: ['minLength'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'Validators.minLength', 'asyncValidator'],
      timeLimit: 75,
      hints: [
        hint(1, 'An async validator returns an Observable<ValidationErrors | null>.'),
        hint(2, 'Use timer() or delay() to simulate an API call latency.'),
      ],
    },
  },

  // Level 18 — Dynamic form controls
  {
    levelId: 'th-advanced-04',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Conditional Subsystems',
    conceptIntroduced: 'Dynamic form controls',
    description: 'Add or remove form controls dynamically based on a selection.',
    data: {
      targetFormSpec: {
        formName: 'subsystemForm',
        elements: [
          elementFull('type', 'select', 'Subsystem Type', 'subsystemType', [
            validation('required', 'Subsystem type is required'),
          ], { options: ['Power', 'Navigation', 'Weapons'] }),
          element('power', 'number', 'Power Level', 'powerLevel', [
            validation('min', 'Power must be positive', 0),
          ]),
          element('coords', 'text', 'Target Coordinates', 'targetCoords', [
            validation('pattern', 'Must be format: X,Y,Z', '^-?\\d+,-?\\d+,-?\\d+$'),
          ]),
        ],
        submitAction: 'Configure subsystem',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Power subsystem', { subsystemType: 'Power', powerLevel: '80', targetCoords: '' }, true),
        testCase('tc2', 'Navigation subsystem', { subsystemType: 'Navigation', powerLevel: '', targetCoords: '100,200,50' }, true),
        testCase('tc3', 'Missing type', { subsystemType: '', powerLevel: '', targetCoords: '' }, false, { subsystemType: ['required'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'Validators.min', 'Validators.pattern'],
      timeLimit: 75,
      hints: [
        hint(1, 'Use formGroup.addControl() and formGroup.removeControl() dynamically.'),
        hint(2, 'Listen to subsystemType.valueChanges to toggle controls.'),
      ],
    },
  },

  // Level 19 — FormArray
  {
    levelId: 'th-advanced-05',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Crew Manifest Array',
    conceptIntroduced: 'FormArray',
    description: 'Build a dynamic list of crew member entries using FormArray.',
    data: {
      targetFormSpec: {
        formName: 'manifestForm',
        elements: [
          element('shipName', 'text', 'Ship Name', 'shipName', [
            validation('required', 'Ship name is required'),
          ]),
          element('crewName', 'text', 'Crew Name', 'crewName', [
            validation('required', 'Crew name is required'),
          ]),
          element('crewRole', 'text', 'Role', 'crewRole', [
            validation('required', 'Role is required'),
          ]),
        ],
        submitAction: 'Submit manifest',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Ship with crew member', { shipName: 'Nexus One', crewName: 'Captain Nova', crewRole: 'Captain' }, true),
        testCase('tc2', 'Missing ship name', { shipName: '', crewName: 'Nova', crewRole: 'Captain' }, false, { shipName: ['required'] }),
        testCase('tc3', 'Missing crew name', { shipName: 'Nexus One', crewName: '', crewRole: 'Engineer' }, false, { crewName: ['required'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormArray', 'FormBuilder', 'Validators.required'],
      timeLimit: 75,
      hints: [
        hint(1, 'Use this.fb.array([]) to create a FormArray.'),
        hint(2, 'Add new crew entries with formArray.push(this.fb.group({ ... })).'),
      ],
    },
  },

  // Level 20 — Nested FormGroups
  {
    levelId: 'th-advanced-06',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Advanced,
    order: 6,
    title: 'Station Address Registry',
    conceptIntroduced: 'Nested FormGroups',
    description: 'Nest an address sub-form within a larger registration form.',
    data: {
      targetFormSpec: {
        formName: 'registryForm',
        elements: [
          element('name', 'text', 'Station Name', 'stationName', [
            validation('required', 'Station name is required'),
          ]),
          elementFull('sector', 'text', 'Sector', 'sector', [
            validation('required', 'Sector is required'),
          ], { groupName: 'location' }),
          elementFull('quadrant', 'text', 'Quadrant', 'quadrant', [
            validation('required', 'Quadrant is required'),
          ], { groupName: 'location' }),
          elementFull('grid', 'text', 'Grid Reference', 'gridRef', [
            validation('pattern', 'Must be format: A1-Z99', '^[A-Z]\\d{1,2}$'),
          ], { groupName: 'location' }),
        ],
        submitAction: 'Register station address',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Complete registration', { stationName: 'Nexus Prime', sector: 'Alpha', quadrant: 'NW', gridRef: 'B7' }, true),
        testCase('tc2', 'Missing station name', { stationName: '', sector: 'Alpha', quadrant: 'NW', gridRef: 'B7' }, false, { stationName: ['required'] }),
        testCase('tc3', 'Invalid grid reference', { stationName: 'Nexus Prime', sector: 'Alpha', quadrant: 'NW', gridRef: '123' }, false, { gridRef: ['pattern'] }),
        testCase('tc4', 'Missing sector', { stationName: 'Nexus Prime', sector: '', quadrant: 'NW', gridRef: 'B7' }, false, { sector: ['required'] }),
      ],
      availableElements: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators.required', 'Validators.pattern'],
      timeLimit: 75,
      hints: [
        hint(1, 'Use fb.group({ location: fb.group({ sector: ... }) }) for nesting.'),
        hint(2, 'In the template, use formGroupName="location" on a container div.'),
      ],
    },
  },

  // =========================================================================
  // BOSS TIER (Level 21)
  // =========================================================================

  // Level 21 — Engineering Diagnostic Terminal (All concepts)
  {
    levelId: 'th-boss-01',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Engineering Diagnostic Terminal',
    conceptIntroduced: 'All concepts',
    description: 'Rebuild the full Engineering Diagnostic Terminal with nested groups, form arrays, custom validators, async validation, dynamic controls, conditional sections, and real-time preview. Must pass 15 test scenarios.',
    parTime: 300,
    data: {
      targetFormSpec: {
        formName: 'engineeringDiagForm',
        elements: [
          element('engineerId', 'text', 'Engineer ID', 'engineerId', [
            validation('required', 'Engineer ID is required'),
            validation('pattern', 'Must be format: ENG-XXXX', '^ENG-\\d{4}$'),
          ]),
          element('engineerName', 'text', 'Engineer Name', 'engineerName', [
            validation('required', 'Engineer name is required'),
            validation('minLength', 'Name must be at least 2 characters', 2),
          ]),
          element('email', 'email', 'Engineer Email', 'engineerEmail', [
            validation('required', 'Email is required'),
            validation('email', 'Must be a valid email'),
          ]),
          elementFull('diagType', 'select', 'Diagnostic Type', 'diagnosticType', [
            validation('required', 'Diagnostic type is required'),
          ], { options: ['Routine', 'Emergency', 'Post-Repair', 'Certification'] }),
          elementFull('priority', 'radio', 'Priority', 'priority', [
            validation('required', 'Priority is required'),
          ], { options: ['Low', 'Medium', 'High', 'Critical'] }),
          element('powerReading', 'number', 'Power Reading (%)', 'powerReading', [
            validation('required', 'Power reading is required'),
            validation('min', 'Minimum reading is 0%', 0),
            validation('max', 'Maximum reading is 100%', 100),
          ]),
          element('tempReading', 'number', 'Temperature (C)', 'tempReading', [
            validation('required', 'Temperature is required'),
            validation('min', 'Minimum temperature is -50C', -50),
            validation('max', 'Maximum temperature is 200C', 200),
          ]),
          elementFull('sector', 'text', 'Sector', 'sector', [
            validation('required', 'Sector is required'),
          ], { groupName: 'location' }),
          elementFull('deck', 'text', 'Deck', 'deck', [
            validation('required', 'Deck is required'),
            validation('pattern', 'Must be format: D1-D99', '^D\\d{1,2}$'),
          ], { groupName: 'location' }),
          element('compName', 'text', 'Component Name', 'componentName', [
            validation('required', 'Component name is required'),
          ]),
          elementFull('compStatus', 'select', 'Component Status', 'componentStatus', [
            validation('required', 'Status is required'),
          ], { options: ['Operational', 'Degraded', 'Failed', 'Replaced'] }),
          element('summary', 'textarea', 'Summary', 'summary', [
            validation('required', 'Summary is required'),
            validation('minLength', 'Summary must be at least 10 characters', 10),
          ]),
          element('certCode', 'text', 'Certification Code', 'certificationCode', [
            validation('custom', 'Code must start with CERT- and end with a digit'),
          ]),
          element('signoff', 'checkbox', 'Engineer Sign-off', 'signoff'),
          element('password', 'password', 'Auth Password', 'authPassword', [
            validation('required', 'Password is required'),
            validation('minLength', 'Must be at least 8 characters', 8),
          ]),
          element('confirmPass', 'password', 'Confirm Password', 'confirmPassword', [
            validation('required', 'Confirmation is required'),
          ]),
        ],
        submitAction: 'Submit engineering diagnostic report',
        formType: 'reactive',
      },
      testCases: [
        testCase('tc1', 'Complete valid diagnostic', {
          engineerId: 'ENG-0042', engineerName: 'Lt. Pulse', engineerEmail: 'pulse@nexus.io',
          diagnosticType: 'Routine', priority: 'Low', powerReading: '85', tempReading: '22',
          sector: 'Alpha', deck: 'D7', componentName: 'Main Reactor', componentStatus: 'Operational',
          summary: 'All systems nominal, routine check passed.', certificationCode: 'CERT-A-1',
          signoff: 'true', authPassword: 'SecureP4ss!', confirmPassword: 'SecureP4ss!',
        }, true),
        testCase('tc2', 'Missing engineer ID', {
          engineerId: '', engineerName: 'Nova', engineerEmail: 'nova@nexus.io',
          diagnosticType: 'Emergency', priority: 'Critical', powerReading: '10', tempReading: '95',
          sector: 'Beta', deck: 'D2', componentName: 'Shield Generator', componentStatus: 'Failed',
          summary: 'Shield generator failure detected urgently.',
          certificationCode: '', signoff: 'false', authPassword: 'Password1!', confirmPassword: 'Password1!',
        }, false, { engineerId: ['required'] }),
        testCase('tc3', 'Invalid engineer ID format', {
          engineerId: 'BAD', engineerName: 'Nova', engineerEmail: 'nova@nexus.io',
          diagnosticType: 'Routine', priority: 'Medium', powerReading: '50', tempReading: '30',
          sector: 'Gamma', deck: 'D5', componentName: 'Life Support', componentStatus: 'Operational',
          summary: 'Standard check on life support systems.',
          certificationCode: '', signoff: 'true', authPassword: 'SecureP4ss!', confirmPassword: 'SecureP4ss!',
        }, false, { engineerId: ['pattern'] }),
        testCase('tc4', 'Invalid email', {
          engineerId: 'ENG-0001', engineerName: 'Helix', engineerEmail: 'not-email',
          diagnosticType: 'Post-Repair', priority: 'High', powerReading: '60', tempReading: '45',
          sector: 'Delta', deck: 'D3', componentName: 'Comms Array', componentStatus: 'Replaced',
          summary: 'Replaced comms array after meteor impact damage.',
          certificationCode: 'CERT-B-2', signoff: 'true', authPassword: 'SecureP4ss!', confirmPassword: 'SecureP4ss!',
        }, false, { engineerEmail: ['email'] }),
        testCase('tc5', 'Power reading below minimum', {
          engineerId: 'ENG-0010', engineerName: 'Bolt', engineerEmail: 'bolt@nexus.io',
          diagnosticType: 'Routine', priority: 'Low', powerReading: '-5', tempReading: '20',
          sector: 'Alpha', deck: 'D1', componentName: 'Aux Power', componentStatus: 'Degraded',
          summary: 'Auxiliary power unit showing degraded performance.',
          certificationCode: '', signoff: 'false', authPassword: 'TestPass1!', confirmPassword: 'TestPass1!',
        }, false, { powerReading: ['min'] }),
        testCase('tc6', 'Power reading above maximum', {
          engineerId: 'ENG-0010', engineerName: 'Bolt', engineerEmail: 'bolt@nexus.io',
          diagnosticType: 'Emergency', priority: 'Critical', powerReading: '150', tempReading: '20',
          sector: 'Alpha', deck: 'D1', componentName: 'Reactor', componentStatus: 'Operational',
          summary: 'Reactor showing abnormal power output readings.',
          certificationCode: '', signoff: 'true', authPassword: 'TestPass1!', confirmPassword: 'TestPass1!',
        }, false, { powerReading: ['max'] }),
        testCase('tc7', 'Temperature out of range', {
          engineerId: 'ENG-0005', engineerName: 'Frost', engineerEmail: 'frost@nexus.io',
          diagnosticType: 'Routine', priority: 'Medium', powerReading: '70', tempReading: '250',
          sector: 'Beta', deck: 'D4', componentName: 'Cooling System', componentStatus: 'Degraded',
          summary: 'Cooling system showing elevated temperature readings.',
          certificationCode: '', signoff: 'true', authPassword: 'CoolPass1!', confirmPassword: 'CoolPass1!',
        }, false, { tempReading: ['max'] }),
        testCase('tc8', 'Invalid deck format', {
          engineerId: 'ENG-0042', engineerName: 'Lt. Pulse', engineerEmail: 'pulse@nexus.io',
          diagnosticType: 'Certification', priority: 'Low', powerReading: '90', tempReading: '25',
          sector: 'Alpha', deck: 'Deck7', componentName: 'Main Reactor', componentStatus: 'Operational',
          summary: 'Certification diagnostic for main reactor.',
          certificationCode: 'CERT-C-3', signoff: 'true', authPassword: 'SecureP4ss!', confirmPassword: 'SecureP4ss!',
        }, false, { deck: ['pattern'] }),
        testCase('tc9', 'Summary too short', {
          engineerId: 'ENG-0042', engineerName: 'Lt. Pulse', engineerEmail: 'pulse@nexus.io',
          diagnosticType: 'Routine', priority: 'Low', powerReading: '85', tempReading: '22',
          sector: 'Alpha', deck: 'D7', componentName: 'Main Reactor', componentStatus: 'Operational',
          summary: 'OK',
          certificationCode: '', signoff: 'true', authPassword: 'SecureP4ss!', confirmPassword: 'SecureP4ss!',
        }, false, { summary: ['minLength'] }),
        testCase('tc10', 'Password mismatch (cross-field)', {
          engineerId: 'ENG-0042', engineerName: 'Lt. Pulse', engineerEmail: 'pulse@nexus.io',
          diagnosticType: 'Routine', priority: 'Low', powerReading: '85', tempReading: '22',
          sector: 'Alpha', deck: 'D7', componentName: 'Main Reactor', componentStatus: 'Operational',
          summary: 'All systems nominal, routine check passed.',
          certificationCode: '', signoff: 'true', authPassword: 'SecureP4ss!', confirmPassword: 'DifferentPass!',
        }, false, { confirmPassword: ['custom'] }),
        testCase('tc11', 'Missing required fields (multiple)', {
          engineerId: '', engineerName: '', engineerEmail: '',
          diagnosticType: '', priority: '', powerReading: '', tempReading: '',
          sector: '', deck: '', componentName: '', componentStatus: '',
          summary: '',
          certificationCode: '', signoff: 'false', authPassword: '', confirmPassword: '',
        }, false, { engineerId: ['required'], engineerName: ['required'], engineerEmail: ['required'] }),
        testCase('tc12', 'Emergency diagnostic with all fields', {
          engineerId: 'ENG-0099', engineerName: 'Commander Vex', engineerEmail: 'vex@nexus.io',
          diagnosticType: 'Emergency', priority: 'Critical', powerReading: '15', tempReading: '180',
          sector: 'Omega', deck: 'D12', componentName: 'FTL Drive', componentStatus: 'Failed',
          summary: 'FTL drive catastrophic failure — immediate attention required.',
          certificationCode: 'CERT-Z-9', signoff: 'true', authPassword: 'EmergencyP4ss!', confirmPassword: 'EmergencyP4ss!',
        }, true),
        testCase('tc13', 'Invalid certification code format', {
          engineerId: 'ENG-0042', engineerName: 'Lt. Pulse', engineerEmail: 'pulse@nexus.io',
          diagnosticType: 'Certification', priority: 'Low', powerReading: '85', tempReading: '22',
          sector: 'Alpha', deck: 'D7', componentName: 'Main Reactor', componentStatus: 'Operational',
          summary: 'Certification diagnostic for main reactor.',
          certificationCode: 'BADCERT', signoff: 'true', authPassword: 'SecureP4ss!', confirmPassword: 'SecureP4ss!',
        }, false, { certificationCode: ['custom'] }),
        testCase('tc14', 'Engineer name too short', {
          engineerId: 'ENG-0042', engineerName: 'X', engineerEmail: 'x@nexus.io',
          diagnosticType: 'Routine', priority: 'Low', powerReading: '50', tempReading: '20',
          sector: 'Alpha', deck: 'D1', componentName: 'Aux Systems', componentStatus: 'Operational',
          summary: 'Quick routine check on auxiliary systems.',
          certificationCode: '', signoff: 'false', authPassword: 'TestPass1!', confirmPassword: 'TestPass1!',
        }, false, { engineerName: ['minLength'] }),
        testCase('tc15', 'Post-repair diagnostic', {
          engineerId: 'ENG-0077', engineerName: 'Spark', engineerEmail: 'spark@nexus.io',
          diagnosticType: 'Post-Repair', priority: 'High', powerReading: '92', tempReading: '38',
          sector: 'Gamma', deck: 'D9', componentName: 'Navigation Array', componentStatus: 'Replaced',
          summary: 'Navigation array replaced and tested successfully.',
          certificationCode: 'CERT-D-4', signoff: 'true', authPassword: 'SparkPass1!', confirmPassword: 'SparkPass1!',
        }, true),
      ],
      availableElements: [
        'ngModel', 'ngSubmit',
        'FormControl', 'FormGroup', 'FormArray', 'FormBuilder',
        'Validators.required', 'Validators.email', 'Validators.pattern',
        'Validators.min', 'Validators.max', 'Validators.minLength', 'Validators.maxLength',
        'customValidator', 'asyncValidator', 'crossFieldValidator',
      ],
      timeLimit: 300,
      hints: [
        hint(1, 'Start by scaffolding the FormGroup with nested location sub-group.'),
        hint(2, 'Use FormArray for the components inspected list.'),
        hint(3, 'Add a cross-field validator at the group level for password matching.'),
        hint(4, 'Dynamic controls: show certificationCode only when diagnosticType is Certification.'),
        hint(5, 'Add an async validator on engineerId to simulate API lookup.'),
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const TERMINAL_HACK_LEVEL_PACK: LevelPack = {
  gameId: 'terminal-hack',
  levels: TERMINAL_HACK_LEVELS,
};
