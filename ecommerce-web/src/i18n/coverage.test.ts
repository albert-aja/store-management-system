import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('keeps every page and shared component static UI string in the source catalog', () => {
  const untranslated: string[] = [];
  const retained = new Set(['SMS Mart', 'SMS-MART', 'WIB', 'WIB:', 'SKU:', 'x @']);
  const directories = ['pages', 'components'].map((name) => join(process.cwd(), 'src', name));
  for (const directory of directories) {
    for (const name of readdirSync(directory).filter((name) => name.endsWith('.tsx') && !name.endsWith('.test.tsx'))) {
      const file = join(directory, name);
      const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        let text = '';
        if (ts.isJsxText(node)) text = node.text.replace(/\s+/g, ' ').trim();
        if (ts.isJsxAttribute(node) && ['aria-label', 'title', 'alt', 'placeholder'].includes(node.name.getText(source))
          && node.initializer && ts.isStringLiteral(node.initializer)) text = node.initializer.text;
        if (/[a-z]/i.test(text) && !retained.has(text) && !/^[\w.+-]+@[\w.-]+\.\w+$/.test(text)) {
          const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
          untranslated.push(`${name}:${line}: ${text}`);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
  }
  expect(untranslated).toEqual([]);
});
