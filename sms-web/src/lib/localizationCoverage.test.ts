import ts from "typescript";
import { describe, expect, it } from "vitest";
import { messageKeys } from "./locale";

const sourceFiles = import.meta.glob("../**/*.{tsx,ts}", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;
const visibleAttributes = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "helperText",
  "label",
  "loadingOverlayLabel",
  "noResultsOverlayLabel",
  "noRowsLabel",
  "placeholder",
  "title",
]);
const messageCalls = new Set([
  "alert",
  "confirm",
  "enqueueSnackbar",
  "prompt",
  "setDocxWarning",
  "setError",
  "setSuccessBanner",
  "setWarning",
]);
const visibleProperties = new Set([
  "alt",
  "ariaLabel",
  "description",
  "headerName",
  "helperText",
  "label",
  "loadingOverlayLabel",
  "noResultsOverlayLabel",
  "noRowsLabel",
  "placeholder",
  "title",
  "tooltip",
]);
const catalogKeys = new Set<string>(messageKeys);
const intentionalUnitsAndCurrency = new Set([
  " WIB",
  "IDR ",
  "Rp ",
  " km/h",
  " kg",
  " m³",
  " km",
  "x",
]);

function isUntranslatedCopy(value: string): boolean {
  return /\p{L}/u.test(value) && !intentionalUnitsAndCurrency.has(value);
}

function literalText(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isJsxExpression(node) && node.expression &&
      (ts.isStringLiteral(node.expression) ||
        ts.isNoSubstitutionTemplateLiteral(node.expression))) {
    return node.expression.text;
  }
  return undefined;
}

function conditionalText(node: ts.Expression, results: string[] = []): string[] {
  if (ts.isCallExpression(node) && node.expression.getText() === "t") return results;
  if (ts.isConditionalExpression(node)) {
    conditionalText(node.whenTrue, results);
    conditionalText(node.whenFalse, results);
  } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    conditionalText(node.right, results);
  } else if (ts.isTemplateExpression(node)) {
    results.push(node.head.text, ...node.templateSpans.map((span) => span.literal.text));
  } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    results.push(node.text);
  }
  return results;
}

describe("source localization coverage", () => {
  it("keeps authored JSX text, visible props, and dialog notifications catalog-backed", () => {
    const uncovered: string[] = [];

    for (const [file, source] of Object.entries(sourceFiles)) {
      if (/\.(test|spec)\./.test(file)) continue;
      const scriptKind = file.endsWith(".tsx") || file.endsWith(".jsx")
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS;
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
      const relativeFile = file.replace(/^\.\.\//, "");

      const visit = (node: ts.Node) => {
        const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
        if (ts.isJsxText(node) && isUntranslatedCopy(node.getText())) {
          uncovered.push(`${relativeFile}:${line} raw JSX text "${node.getText().trim()}"`);
        }

        if (ts.isJsxAttribute(node) && visibleAttributes.has(node.name.getText())) {
          const value = node.initializer && literalText(node.initializer);
          if (value && isUntranslatedCopy(value)) {
            uncovered.push(`${relativeFile}:${line} hard-coded ${node.name.getText()}="${value}"`);
          }
          if (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
            for (const text of conditionalText(node.initializer.expression)) {
              if (isUntranslatedCopy(text)) {
                uncovered.push(`${relativeFile}:${line} hard-coded ${node.name.getText()}="${text}"`);
              }
            }
          }
        }

        const propertyName = ts.isPropertyAssignment(node) &&
          (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
          ? node.name.text
          : undefined;
        if (ts.isPropertyAssignment(node) && propertyName && visibleProperties.has(propertyName)) {
          for (const text of conditionalText(node.initializer)) {
            if (isUntranslatedCopy(text) && !catalogKeys.has(text)) {
              uncovered.push(`${relativeFile}:${line} hard-coded ${propertyName}="${text}"`);
            }
          }
        }

        if (ts.isJsxExpression(node) && node.expression &&
            (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
          for (const text of conditionalText(node.expression)) {
            if (isUntranslatedCopy(text)) {
              uncovered.push(`${relativeFile}:${line} raw conditional JSX text "${text}"`);
            }
          }
        }

        if (ts.isCallExpression(node)) {
          const callee = node.expression.getText(ast).split(".").at(-1);
          const message = node.arguments[0];
          if (callee && messageCalls.has(callee) && message) {
            for (const text of conditionalText(message)) {
              if (isUntranslatedCopy(text)) {
                uncovered.push(`${relativeFile}:${line} hard-coded ${callee}("${text}")`);
              }
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(ast);
    }

    expect(uncovered).toEqual([]);
  });
});
