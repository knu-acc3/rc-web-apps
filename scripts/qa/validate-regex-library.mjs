import fs from 'node:fs';
import ts from 'typescript';

const file = 'src/tools/developers/RegexLibrary.tsx';
const source = fs.readFileSync(file, 'utf8');
const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let patterns;
for (const statement of ast.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && declaration.name.text === 'PATTERNS') patterns = declaration.initializer;
  }
}
if (!patterns || !ts.isArrayLiteralExpression(patterns)) throw new Error('PATTERNS not found');
const failures = [];
let semver;
for (const element of patterns.elements) {
  if (!ts.isObjectLiteralExpression(element)) continue;
  const values = Object.fromEntries(element.properties.filter(ts.isPropertyAssignment).map((property) => [property.name.getText(ast), property.initializer]));
  const id = values.id?.text;
  const pattern = values.pattern?.text;
  const flags = values.flags?.text;
  try {
    new RegExp(pattern, flags);
    if (id === 'semver') semver = new RegExp(pattern, flags);
  } catch (error) {
    failures.push(`${id}: ${error.message}`);
  }
}
if (!semver?.test('1.0.0-rc.1') || semver.test('1.0.0-01')) {
  failures.push('semver: prerelease leading-zero rules are incorrect');
}
if (failures.length) throw new Error(failures.join('\n'));
console.log(`Regex library OK: ${patterns.elements.length} patterns compile.`);
