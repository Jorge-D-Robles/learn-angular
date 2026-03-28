/* eslint-disable no-useless-escape */
/**
 * Custom Monaco Monarch grammars for Angular-aware syntax highlighting.
 *
 * Registers two languages:
 * - `angular-typescript`: TypeScript with Angular template awareness in backtick strings
 * - `angular-html`: HTML with Angular bindings and control flow
 *
 * Also defines a `vs-dark-angular` theme with colors for Angular-specific tokens.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const TS_KEYWORDS = [
  'abstract', 'any', 'as', 'asserts', 'bigint', 'boolean', 'break',
  'case', 'catch', 'class', 'continue', 'const', 'constructor',
  'debugger', 'declare', 'default', 'delete', 'do', 'else', 'enum',
  'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
  'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof',
  'interface', 'is', 'keyof', 'let', 'module', 'namespace', 'never',
  'new', 'null', 'number', 'object', 'out', 'package', 'private',
  'protected', 'public', 'override', 'readonly', 'require', 'global',
  'return', 'satisfies', 'set', 'static', 'string', 'super', 'switch',
  'symbol', 'this', 'throw', 'true', 'try', 'type', 'typeof',
  'undefined', 'unique', 'unknown', 'var', 'void', 'while', 'with',
  'yield', 'async', 'await', 'of',
];

export function registerAngularLanguages(monaco: any): void {
  registerAngularTypeScript(monaco);
  registerAngularHtml(monaco);
  defineAngularTheme(monaco);
}

function registerAngularTypeScript(monaco: any): void {
  monaco.languages.register({
    id: 'angular-typescript',
    aliases: ['Angular TypeScript'],
  });

  monaco.languages.setMonarchTokensProvider('angular-typescript', {
    defaultToken: 'invalid',
    tokenPostfix: '.ats',
    keywords: TS_KEYWORDS,
    operators: [
      '<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**',
      '*', '/', '%', '++', '--', '<<', '</', '>>', '>>>', '&', '|',
      '^', '!', '~', '&&', '||', '??', '?', ':', '=', '+=', '-=',
      '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=',
      '^=', '@',
    ],
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    digits: /\d+(_+\d+)*/,
    octaldigits: /[0-7]+(_+[0-7]+)*/,
    binarydigits: /[0-1]+(_+[0-1]+)*/,
    hexdigits: /[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
    regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
    regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

    tokenizer: {
      root: [[/[{}]/, 'delimiter.bracket'], { include: 'common' }],

      common: [
        // Decorators
        [/@[a-zA-Z_]\w*/, 'annotation'],
        [/#?[a-z_$][\w$]*/, {
          cases: { '@keywords': 'keyword', '@default': 'identifier' },
        }],
        [/[A-Z][\w$]*/, 'type.identifier'],
        { include: '@whitespace' },
        [/\/(?=([^\\\/]|\\.)+\/([dgimsuy]*)(\s*)(\.|;|,|\)|\]|\}|$))/,
          { token: 'regexp', bracket: '@open', next: '@regexp' }],
        [/[()\[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/!(?=([^=]|$))/, 'delimiter'],
        [/@symbols/, { cases: { '@operators': 'delimiter', '@default': '' } }],
        [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
        [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
        [/0[xX](@hexdigits)n?/, 'number.hex'],
        [/0[oO]?(@octaldigits)n?/, 'number.octal'],
        [/0[bB](@binarydigits)n?/, 'number.binary'],
        [/(@digits)n?/, 'number'],
        [/[;,.]/, 'delimiter'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/`/, 'string', '@string_backtick'],
      ],

      whitespace: [
        [/[ \t\r\n]+/, ''],
        [/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],

      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],

      jsdoc: [
        [/[^\/*]+/, 'comment.doc'],
        [/\*\//, 'comment.doc', '@pop'],
        [/[\/*]/, 'comment.doc'],
      ],

      regexp: [
        [/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],
        [/(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/, ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]],
        [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
        [/[()]/, 'regexp.escape.control'],
        [/@regexpctl/, 'regexp.escape.control'],
        [/[^\\\/]/, 'regexp'],
        [/@regexpesc/, 'regexp.escape'],
        [/\\\./, 'regexp.invalid'],
        [/(\/)([dgimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],
      ],

      regexrange: [
        [/-/, 'regexp.escape.control'],
        [/\^/, 'regexp.invalid'],
        [/@regexpesc/, 'regexp.escape'],
        [/[^\]]/, 'regexp'],
        [/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }],
      ],

      string_double: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, 'string', '@pop'],
      ],

      string_single: [
        [/[^\\']+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/'/, 'string', '@pop'],
      ],

      // Backtick strings with Angular template awareness
      string_backtick: [
        // Standard TS template expression ${...}
        [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],

        // Angular interpolation {{ }}
        [/\{\{/, 'delimiter.interpolation'],
        [/\}\}/, 'delimiter.interpolation'],

        // Angular control flow
        [/@(if|else if|else|for|switch|case|default|defer|placeholder|loading|error|empty)\b/, 'keyword.angular.controlflow'],

        // Two-way binding [(xxx)]
        [/\[\([\w.\-]+\)\]/, 'attribute.angular.banana'],
        // Property binding [xxx]
        [/\[[\w.\-]+\]/, 'attribute.angular.binding'],
        // Event binding (xxx)
        [/\([\w.\-]+\)/, 'attribute.angular.event'],

        // Structural directives
        [/\*ng[A-Z]\w*/, 'attribute.angular.structural'],

        // Template reference variable #xxx
        [/#[a-zA-Z]\w*/, 'variable.angular.templateref'],

        // Pipe operator (single |, not ||)
        [/\|(?!\|)/, 'delimiter.angular.pipe'],

        // Standard content
        [/[^\\`$\{\}\[\]\(\)@#|]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/`/, 'string', '@pop'],
      ],

      bracketCounting: [
        [/\{/, 'delimiter.bracket', '@bracketCounting'],
        [/\}/, 'delimiter.bracket', '@pop'],
        { include: 'common' },
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('angular-typescript', {
    comments: { lineComment: '//', blockComment: ['/*', '*/'] },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
      { open: '`', close: '`', notIn: ['string', 'comment'] },
    ],
  });
}

function registerAngularHtml(monaco: any): void {
  monaco.languages.register({
    id: 'angular-html',
    aliases: ['Angular HTML'],
  });

  monaco.languages.setMonarchTokensProvider('angular-html', {
    defaultToken: '',
    tokenPostfix: '.ahtml',
    ignoreCase: true,

    tokenizer: {
      root: [
        [/<!DOCTYPE/, 'metatag', '@doctype'],
        [/<!--/, 'comment', '@comment'],
        // Self-closing tags
        [/(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/, ['delimiter', 'tag', '', 'delimiter']],
        // Opening tags
        [/(<)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
        // Closing tags
        [/(<\/)((?:[\w\-]+:)?[\w\-]+)/, ['delimiter', { token: 'tag', next: '@otherTag' }]],
        [/</, 'delimiter'],

        // Angular control flow blocks
        [/@(if|else if|else|for|switch|case|default|defer|placeholder|loading|error|empty)\b/, 'keyword.angular.controlflow'],

        // Angular interpolation {{ }}
        [/\{\{/, { token: 'delimiter.interpolation', next: '@interpolation' }],

        [/[^<@{]+/],
        [/[{@]/],
      ],

      interpolation: [
        [/\}\}/, { token: 'delimiter.interpolation', next: '@pop' }],
        [/\|(?!\|)/, 'delimiter.angular.pipe'],
        [/[^}|]+/, 'expression.angular'],
      ],

      doctype: [
        [/[^>]+/, 'metatag.content'],
        [/>/, 'metatag', '@pop'],
      ],

      comment: [
        [/-->/, 'comment', '@pop'],
        [/[^-]+/, 'comment.content'],
        [/./, 'comment.content'],
      ],

      otherTag: [
        [/\/?>/, 'delimiter', '@pop'],

        // Two-way binding [(xxx)]
        [/(\[\()([.\w\-]+)(\)\])/, ['delimiter.angular', 'attribute.angular.banana', 'delimiter.angular']],
        // Property binding [xxx]
        [/(\[)([.\w\-]+)(\])/, ['delimiter.angular', 'attribute.angular.binding', 'delimiter.angular']],
        // Event binding (xxx)
        [/(\()([.\w\-]+)(\))/, ['delimiter.angular', 'attribute.angular.event', 'delimiter.angular']],

        // Structural directives *ngXxx
        [/\*[a-zA-Z][\w]*/, 'attribute.angular.structural'],

        // Template reference variable #xxx
        [/#[a-zA-Z][\w]*/, 'variable.angular.templateref'],

        // Standard HTML attribute values and names
        [/"([^"]*)"/, 'attribute.value'],
        [/'([^']*)'/, 'attribute.value'],
        [/[\w\-]+/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/[ \t\r\n]+/],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('angular-html', {
    comments: { blockComment: ['<!--', '-->'] },
    brackets: [['<', '>'], ['{', '}'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
}

function defineAngularTheme(monaco: any): void {
  monaco.editor.defineTheme('vs-dark-angular', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'annotation', foreground: 'DCDCAA' },
      { token: 'keyword.angular.controlflow', foreground: 'C586C0' },
      { token: 'delimiter.interpolation', foreground: 'DCDCAA' },
      { token: 'attribute.angular.binding', foreground: '9CDCFE' },
      { token: 'attribute.angular.event', foreground: 'DCDCAA' },
      { token: 'attribute.angular.banana', foreground: '4EC9B0' },
      { token: 'attribute.angular.structural', foreground: 'C586C0' },
      { token: 'variable.angular.templateref', foreground: '4FC1FF' },
      { token: 'delimiter.angular.pipe', foreground: 'D4D4D4' },
      { token: 'delimiter.angular', foreground: '808080' },
      { token: 'expression.angular', foreground: '9CDCFE' },
    ],
    colors: {},
  });
}
