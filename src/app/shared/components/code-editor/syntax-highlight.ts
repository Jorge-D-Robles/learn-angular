export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'decorator'
  | 'number'
  | 'tag'
  | 'attr'
  | 'punctuation'
  | 'text';

export interface Token {
  readonly text: string;
  readonly type: TokenType;
}

interface TokenPattern {
  readonly regex: RegExp;
  readonly type: TokenType;
}

const TS_KEYWORDS =
  /\b(import|export|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|new|this|true|false|null|undefined|async|await|readonly|static|private|protected|public|abstract|enum|namespace|module|declare|of|in|as|is|keyof|typeof|void|never|any|unknown|string|number|boolean|object|symbol|bigint)\b/;

const TS_PATTERNS: TokenPattern[] = [
  { regex: /\/\/.*$/m, type: 'comment' },
  { regex: /\/\*[\s\S]*?\*\//, type: 'comment' },
  { regex: /`[^`]*`/, type: 'string' },
  { regex: /"(?:[^"\\]|\\.)*"/, type: 'string' },
  { regex: /'(?:[^'\\]|\\.)*'/, type: 'string' },
  { regex: /@[A-Za-z]+/, type: 'decorator' },
  { regex: TS_KEYWORDS, type: 'keyword' },
  { regex: /\b\d+\.?\d*\b/, type: 'number' },
];

const HTML_PATTERNS: TokenPattern[] = [
  { regex: /<!--[\s\S]*?-->/, type: 'comment' },
  { regex: /\{\{.*?\}\}/, type: 'keyword' },
  { regex: /"(?:[^"\\]|\\.)*"/, type: 'string' },
  { regex: /'(?:[^'\\]|\\.)*'/, type: 'string' },
  { regex: /<\/?[a-zA-Z][\w-]*/, type: 'tag' },
  { regex: /\/?>/, type: 'tag' },
  { regex: /\b[a-zA-Z][\w-]*(?==)/, type: 'attr' },
];

const LANGUAGE_PATTERNS: Record<string, TokenPattern[]> = {
  typescript: TS_PATTERNS,
  html: HTML_PATTERNS,
};

/**
 * Tokenize source code into structured tokens for syntax highlighting.
 * Processes the full code string (not line-by-line) to handle multi-line constructs.
 * Returns an empty array for empty input, or a single 'text' token for unknown languages.
 */
export function tokenize(code: string, language: string): Token[] {
  if (code === '') {
    return [];
  }

  const patterns = LANGUAGE_PATTERNS[language];
  if (!patterns) {
    return [{ text: code, type: 'text' }];
  }

  const tokens: Token[] = [];
  let pos = 0;
  let textBuffer = '';

  while (pos < code.length) {
    const match = matchAtPosition(code, pos, patterns);

    if (match) {
      if (textBuffer) {
        tokens.push({ text: textBuffer, type: 'text' });
        textBuffer = '';
      }
      tokens.push({ text: match.text, type: match.type });
      pos += match.text.length;
    } else {
      textBuffer += code[pos];
      pos++;
    }
  }

  if (textBuffer) {
    tokens.push({ text: textBuffer, type: 'text' });
  }

  return tokens;
}

function matchAtPosition(
  code: string,
  pos: number,
  patterns: TokenPattern[],
): { text: string; type: TokenType } | null {
  const remaining = code.slice(pos);

  for (const pattern of patterns) {
    const anchoredRegex = new RegExp(
      '^(?:' + pattern.regex.source + ')',
      pattern.regex.flags,
    );
    const match = anchoredRegex.exec(remaining);
    if (match) {
      return { text: match[0], type: pattern.type };
    }
  }

  return null;
}
