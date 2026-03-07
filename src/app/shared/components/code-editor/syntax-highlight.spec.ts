import { tokenize } from './syntax-highlight';

describe('tokenize', () => {
  it('should highlight TypeScript keywords', () => {
    const tokens = tokenize('const x = 1', 'typescript');
    const keywordTokens = tokens.filter((t) => t.type === 'keyword');
    expect(keywordTokens.length).toBeGreaterThan(0);
    expect(keywordTokens[0].text).toBe('const');
  });

  it('should highlight string literals', () => {
    const tokens = tokenize(`const a = "hello"; const b = 'world'; const c = \`tmpl\``, 'typescript');
    const stringTokens = tokens.filter((t) => t.type === 'string');
    expect(stringTokens.length).toBe(3);
    expect(stringTokens[0].text).toBe('"hello"');
    expect(stringTokens[1].text).toBe("'world'");
    expect(stringTokens[2].text).toBe('`tmpl`');
  });

  it('should highlight single-line comments', () => {
    const tokens = tokenize('const x = 1; // this is a comment', 'typescript');
    const commentTokens = tokens.filter((t) => t.type === 'comment');
    expect(commentTokens.length).toBe(1);
    expect(commentTokens[0].text).toBe('// this is a comment');
  });

  it('should highlight multi-line comments', () => {
    const tokens = tokenize('/* multi\nline\ncomment */', 'typescript');
    const commentTokens = tokens.filter((t) => t.type === 'comment');
    expect(commentTokens.length).toBe(1);
    expect(commentTokens[0].text).toBe('/* multi\nline\ncomment */');
  });

  it('should highlight decorators', () => {
    const tokens = tokenize('@Component', 'typescript');
    const decoratorTokens = tokens.filter((t) => t.type === 'decorator');
    expect(decoratorTokens.length).toBe(1);
    expect(decoratorTokens[0].text).toBe('@Component');
  });

  it('should highlight numbers', () => {
    const tokens = tokenize('const x = 42; const y = 3.14;', 'typescript');
    const numberTokens = tokens.filter((t) => t.type === 'number');
    expect(numberTokens.length).toBe(2);
    expect(numberTokens[0].text).toBe('42');
    expect(numberTokens[1].text).toBe('3.14');
  });

  it('should handle HTML language', () => {
    const tokens = tokenize('<div class="foo">bar</div>', 'html');
    const tagTokens = tokens.filter((t) => t.type === 'tag');
    expect(tagTokens.length).toBeGreaterThan(0);
    const attrTokens = tokens.filter((t) => t.type === 'attr');
    expect(attrTokens.length).toBeGreaterThan(0);
    expect(attrTokens[0].text).toBe('class');
  });

  it('should handle empty input', () => {
    const tokens = tokenize('', 'typescript');
    expect(tokens).toEqual([]);
  });

  it('should return plain text for unknown language', () => {
    const tokens = tokenize('hello world', 'python');
    expect(tokens).toEqual([{ text: 'hello world', type: 'text' }]);
  });

  it('should preserve whitespace in tokens', () => {
    const tokens = tokenize('  const  x = 1', 'typescript');
    const joined = tokens.map((t) => t.text).join('');
    expect(joined).toBe('  const  x = 1');
  });

  it('should highlight HTML interpolation as keyword', () => {
    const tokens = tokenize('<p>{{ name }}</p>', 'html');
    const interpTokens = tokens.filter(
      (t) => t.type === 'keyword' && t.text.includes('{{'),
    );
    expect(interpTokens.length).toBe(1);
    expect(interpTokens[0].text).toBe('{{ name }}');
  });
});
