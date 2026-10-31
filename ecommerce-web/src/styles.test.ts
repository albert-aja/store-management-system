import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';

describe('production storefront styling', () => {
  it('compiles Tailwind and responsive product grids instead of shipping raw directives', async () => {
    const source = readFileSync(new URL('./index.css', import.meta.url), 'utf8');
    const result = await postcss([tailwindcss('./tailwind.config.js')]).process(source, {
      from: 'src/index.css',
    });
    expect(result.css).not.toContain('@tailwind');
    const columns: string[] = [];
    result.root.walkRules('.product-grid', (rule) => {
      rule.walkDecls('grid-template-columns', (declaration) => { columns.push(declaration.value); });
    });
    expect(columns).toEqual([
      'repeat(2, minmax(0, 1fr))',
      'repeat(3, minmax(0, 1fr))',
      'repeat(4, minmax(0, 1fr))',
    ]);
    const declarations: Record<string, string> = {};
    result.root.walkRules('.button-primary', (rule) => {
      rule.walkDecls((declaration) => { declarations[declaration.prop] = declaration.value; });
    });
    expect(declarations['min-height']).toBe('2.75rem');
    expect(declarations['border-radius']).toBe('0.75rem');
    expect(declarations['background-color']).toContain('2 132 199');
    expect(result.css).toContain('prefers-reduced-motion: reduce');
    expect(result.css).toContain('env(safe-area-inset-bottom)');
  });
});
