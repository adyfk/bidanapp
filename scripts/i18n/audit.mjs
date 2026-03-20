import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const MAX_EXPANSIONS = 512;
const SOURCE_LOCALE = 'en';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const frontendRoot = path.join(repoRoot, 'apps/frontend');
const frontendSrcRoot = path.join(frontendRoot, 'src');
const messagesDir = path.join(frontendRoot, 'messages');
const tsconfigPath = path.join(frontendRoot, 'tsconfig.json');
const writeMode = process.argv.includes('--write');

ensureMessageDeclaration(path.join(messagesDir, `${SOURCE_LOCALE}.json`));

const localeNames = fs
  .readdirSync(messagesDir)
  .filter((fileName) => fileName.endsWith('.json') && !fileName.endsWith('.d.json.ts'))
  .map((fileName) => fileName.replace(/\.json$/, ''))
  .sort();

if (!localeNames.includes(SOURCE_LOCALE)) {
  console.error(`Source locale ${SOURCE_LOCALE} was not found in ${messagesDir}`);
  process.exit(1);
}

const localeMessages = new Map(
  localeNames.map((locale) => [locale, readJson(path.join(messagesDir, `${locale}.json`))]),
);
let sourceMessages = localeMessages.get(SOURCE_LOCALE);
let sourceKeys = flattenMessageKeys(sourceMessages);
let sourceKeySet = new Set(sourceKeys);

const tsConfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
if (tsConfigFile.error) {
  console.error(formatDiagnostic(tsConfigFile.error));
  process.exit(1);
}

const parsedConfig = ts.parseJsonConfigFileContent(tsConfigFile.config, ts.sys, frontendRoot);
const program = ts.createProgram({
  options: parsedConfig.options,
  rootNames: parsedConfig.fileNames,
});
const checker = program.getTypeChecker();
const translatorSymbols = new Map();
const usedKeys = new Set();
const missingKeyRefs = new Map();
const unresolvedUsages = [];

for (const sourceFile of program.getSourceFiles()) {
  if (!isFrontendSourceFile(sourceFile.fileName)) {
    continue;
  }

  visit(sourceFile);
}

const usedKeyList = Array.from(usedKeys).sort();
let unusedKeys = sourceKeys.filter((key) => !usedKeys.has(key));
const missingKeys = Array.from(missingKeyRefs.keys()).sort();
let localeDrift = localeNames
  .filter((locale) => locale !== SOURCE_LOCALE)
  .map((locale) => {
    const messageKeys = flattenMessageKeys(localeMessages.get(locale));
    const messageKeySet = new Set(messageKeys);
    return {
      locale,
      extraKeys: messageKeys.filter((key) => !sourceKeySet.has(key)).sort(),
      missingKeys: sourceKeys.filter((key) => !messageKeySet.has(key)).sort(),
    };
  });

const hasBlockingIssues = missingKeys.length > 0 || unresolvedUsages.length > 0;

if (writeMode) {
  if (hasBlockingIssues) {
    console.error('Cannot prune i18n keys while missing keys or unresolved dynamic usages still exist.\n');
  } else {
    pruneUnusedKeys({
      localeMessages,
      localeDrift,
      localeNames,
      unusedKeys,
    });

    sourceMessages = localeMessages.get(SOURCE_LOCALE);
    sourceKeys = flattenMessageKeys(sourceMessages);
    sourceKeySet = new Set(sourceKeys);
    unusedKeys = sourceKeys.filter((key) => !usedKeys.has(key));
    localeDrift = localeNames
      .filter((locale) => locale !== SOURCE_LOCALE)
      .map((locale) => {
        const messageKeys = flattenMessageKeys(localeMessages.get(locale));
        const messageKeySet = new Set(messageKeys);
        return {
          locale,
          extraKeys: messageKeys.filter((key) => !sourceKeySet.has(key)).sort(),
          missingKeys: sourceKeys.filter((key) => !messageKeySet.has(key)).sort(),
        };
      });
  }
}

printSummary({
  localeDrift,
  localeNames,
  missingKeyRefs,
  missingKeys,
  sourceKeys,
  unresolvedUsages,
  unusedKeys,
  usedKeyList,
  writeMode,
});

if (hasBlockingIssues) {
  process.exit(1);
}

if (
  !writeMode &&
  (unusedKeys.length > 0 || localeDrift.some((entry) => entry.extraKeys.length > 0 || entry.missingKeys.length > 0))
) {
  process.exit(1);
}

function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
    const translator = getTranslatorInfo(node.initializer);
    if (translator) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        translatorSymbols.set(symbol, translator);
      }
    }
  }

  if (ts.isCallExpression(node)) {
    const translationCall = getTranslationCall(node);
    if (translationCall) {
      recordTranslationUsage(translationCall);
    }
  }

  ts.forEachChild(node, visit);
}

function getTranslatorInfo(expression) {
  let current = unwrapExpression(expression);

  if (ts.isAwaitExpression(current)) {
    current = unwrapExpression(current.expression);
  }

  if (!ts.isCallExpression(current)) {
    return null;
  }

  const callee = unwrapExpression(current.expression);

  if (ts.isIdentifier(callee) && (callee.text === 'useTranslations' || callee.text === 'getTranslations')) {
    const namespaceArgument = current.arguments[0];
    if (!namespaceArgument) {
      return { namespaces: null };
    }

    const namespaces = getNamespaceValuesFromExpression(namespaceArgument);
    return namespaces ? { namespaces } : null;
  }

  if (ts.isIdentifier(callee) && callee.text === 'createTranslator') {
    const config = current.arguments[0];
    if (!config || !ts.isObjectLiteralExpression(config)) {
      return null;
    }

    const namespaceProperty = config.properties.find(
      (property) =>
        ts.isPropertyAssignment(property) &&
        getPropertyName(property.name) === 'namespace' &&
        property.initializer !== undefined,
    );

    if (!namespaceProperty || !ts.isPropertyAssignment(namespaceProperty)) {
      return { namespaces: null };
    }

    const namespaces = getNamespaceValuesFromExpression(namespaceProperty.initializer);
    return namespaces ? { namespaces } : null;
  }

  return null;
}

function getTranslationCall(node) {
  const callee = unwrapExpression(node.expression);

  if (ts.isIdentifier(callee)) {
    const symbol = checker.getSymbolAtLocation(callee);
    const translator = symbol ? (translatorSymbols.get(symbol) ?? getTranslatorInfoFromType(symbol, callee)) : null;
    if (!translator) {
      return null;
    }

    return {
      call: node,
      keyExpression: node.arguments[0],
      namespaces: translator.namespaces,
    };
  }

  if (ts.isPropertyAccessExpression(callee)) {
    if (!['has', 'markup', 'raw', 'rich'].includes(callee.name.text)) {
      return null;
    }

    const symbol = checker.getSymbolAtLocation(callee.expression);
    const translator = symbol
      ? (translatorSymbols.get(symbol) ?? getTranslatorInfoFromType(symbol, callee.expression))
      : null;
    if (!translator) {
      return null;
    }

    return {
      call: node,
      keyExpression: node.arguments[0],
      namespaces: translator.namespaces,
    };
  }

  if (ts.isCallExpression(callee)) {
    const translator = getTranslatorInfo(callee);
    if (!translator) {
      return null;
    }

    return {
      call: node,
      keyExpression: node.arguments[0],
      namespaces: translator.namespaces,
    };
  }

  return null;
}

function getTranslatorInfoFromType(symbol, location) {
  const translatorType = checker.getTypeOfSymbolAtLocation(symbol, location);

  if (translatorType.aliasSymbol?.escapedName !== 'Translator') {
    const namespacesFromAliasDeclaration = getNamespacesFromTranslatorAlias(translatorType.aliasSymbol);
    return namespacesFromAliasDeclaration ? { namespaces: namespacesFromAliasDeclaration } : null;
  }

  const namespaceType = translatorType.aliasTypeArguments?.[1];
  const namespaces = namespaceType ? getLiteralValuesFromType(namespaceType) : [];

  return { namespaces: namespaces.length > 0 ? namespaces : null };
}

function getNamespacesFromTranslatorAlias(aliasSymbol) {
  if (!aliasSymbol?.declarations) {
    return null;
  }

  for (const declaration of aliasSymbol.declarations) {
    if (!ts.isTypeAliasDeclaration(declaration)) {
      continue;
    }

    const aliasType = declaration.type;
    if (!ts.isTypeReferenceNode(aliasType)) {
      continue;
    }

    const typeName = ts.isIdentifier(aliasType.typeName)
      ? aliasType.typeName.text
      : ts.isQualifiedName(aliasType.typeName)
        ? aliasType.typeName.right.text
        : null;

    if (typeName !== 'Translator') {
      continue;
    }

    const namespaceTypeArgument = aliasType.typeArguments?.[1];
    const namespaces = namespaceTypeArgument ? getStringLiteralValuesFromTypeNode(namespaceTypeArgument) : [];
    if (namespaces.length > 0) {
      return namespaces;
    }
  }

  return null;
}

function recordTranslationUsage({ call, keyExpression, namespaces }) {
  if (!keyExpression) {
    return;
  }

  const expanded = expandKeyExpression(keyExpression, call.getSourceFile());

  if (!expanded.ok) {
    unresolvedUsages.push({
      location: formatLocation(call),
      namespaces,
      reason: expanded.reason,
      snippet: keyExpression.getText(call.getSourceFile()),
    });
    return;
  }

  const namespaceValues = namespaces ?? [null];

  for (const namespace of namespaceValues) {
    for (const key of expanded.values) {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      usedKeys.add(fullKey);

      if (!sourceKeySet.has(fullKey)) {
        const refs = missingKeyRefs.get(fullKey) ?? [];
        refs.push(formatLocation(call));
        missingKeyRefs.set(fullKey, refs);
      }
    }
  }
}

function getNamespaceValuesFromExpression(expression) {
  const staticValue = getStaticStringValue(expression);
  if (staticValue) {
    return [staticValue];
  }

  const typeValues = getLiteralValuesFromType(checker.getTypeAtLocation(expression)).filter(
    (value) => value.length > 0,
  );
  return typeValues.length > 0 ? typeValues : null;
}

function getStringLiteralValuesFromTypeNode(node) {
  if (ts.isLiteralTypeNode(node)) {
    return ts.isStringLiteral(node.literal) ? [node.literal.text] : [];
  }

  if (ts.isUnionTypeNode(node)) {
    return uniqueStrings(node.types.flatMap((typeNode) => getStringLiteralValuesFromTypeNode(typeNode)));
  }

  return [];
}

function expandKeyExpression(expression, sourceFile) {
  const current = unwrapExpression(expression);

  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return { ok: true, values: [current.text] };
  }

  if (ts.isTemplateExpression(current)) {
    let values = [current.head.text];

    for (const span of current.templateSpans) {
      const expanded = expandKeyExpression(span.expression, sourceFile);
      if (!expanded.ok) {
        return expanded;
      }

      values = combine(values, expanded.values, current, sourceFile);
      if (!values) {
        return {
          ok: false,
          reason: `Key expansion exceeded ${MAX_EXPANSIONS} combinations`,
        };
      }

      values = values.map((value) => value + span.literal.text);
    }

    return { ok: true, values };
  }

  if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = expandKeyExpression(current.left, sourceFile);
    if (!left.ok) {
      return left;
    }

    const right = expandKeyExpression(current.right, sourceFile);
    if (!right.ok) {
      return right;
    }

    const values = combine(left.values, right.values, current, sourceFile);
    if (!values) {
      return {
        ok: false,
        reason: `Key expansion exceeded ${MAX_EXPANSIONS} combinations`,
      };
    }

    return { ok: true, values };
  }

  if (ts.isConditionalExpression(current)) {
    const whenTrue = expandKeyExpression(current.whenTrue, sourceFile);
    if (!whenTrue.ok) {
      return whenTrue;
    }

    const whenFalse = expandKeyExpression(current.whenFalse, sourceFile);
    if (!whenFalse.ok) {
      return whenFalse;
    }

    return { ok: true, values: uniqueStrings([...whenTrue.values, ...whenFalse.values]) };
  }

  const typeValues = getLiteralValuesFromType(checker.getTypeAtLocation(current));
  if (typeValues.length > 0) {
    return { ok: true, values: typeValues };
  }

  return {
    ok: false,
    reason: `Unable to resolve dynamic key expression at ${formatLocation(current)}`,
  };
}

function getLiteralValuesFromType(type) {
  const values = new Set();
  let unresolved = false;

  collect(type);

  if (unresolved) {
    return [];
  }

  return Array.from(values).sort();

  function collect(currentType) {
    const constrainedType = checker.getBaseConstraintOfType(currentType) ?? currentType;

    if (constrainedType.isUnion()) {
      for (const unionType of constrainedType.types) {
        collect(unionType);
      }
      return;
    }

    if (constrainedType.isIntersection()) {
      unresolved = true;
      return;
    }

    if (constrainedType.flags & ts.TypeFlags.StringLiteral) {
      values.add(constrainedType.value);
      return;
    }

    if (constrainedType.flags & ts.TypeFlags.NumberLiteral) {
      values.add(String(constrainedType.value));
      return;
    }

    if (constrainedType.flags & ts.TypeFlags.BooleanLiteral) {
      values.add(constrainedType.intrinsicName);
      return;
    }

    if (
      constrainedType.flags & ts.TypeFlags.Null ||
      constrainedType.flags & ts.TypeFlags.Undefined ||
      constrainedType.flags & ts.TypeFlags.Void
    ) {
      return;
    }

    unresolved = true;
  }
}

function combine(leftValues, rightValues, _node, _sourceFile) {
  if (leftValues.length * rightValues.length > MAX_EXPANSIONS) {
    return null;
  }

  const combined = [];
  for (const leftValue of leftValues) {
    for (const rightValue of rightValues) {
      combined.push(leftValue + rightValue);
    }
  }

  return uniqueStrings(combined);
}

function flattenMessageKeys(messages, prefix = '', keys = []) {
  for (const [key, value] of Object.entries(messages)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      keys.push(nextKey);
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenMessageKeys(value, nextKey, keys);
    }
  }

  return keys.sort();
}

function pruneUnusedKeys({ localeDrift, localeMessages, localeNames, unusedKeys }) {
  const keysToRemoveByLocale = new Map(localeNames.map((locale) => [locale, new Set(unusedKeys)]));

  for (const drift of localeDrift) {
    const localeKeySet = keysToRemoveByLocale.get(drift.locale);
    for (const extraKey of drift.extraKeys) {
      localeKeySet.add(extraKey);
    }
  }

  for (const locale of localeNames) {
    const messageObject = localeMessages.get(locale);
    const keysToRemove = Array.from(keysToRemoveByLocale.get(locale)).sort();
    let changed = false;

    for (const key of keysToRemove) {
      changed = removeMessageKey(messageObject, key) || changed;
    }

    if (!changed) {
      continue;
    }

    const filePath = path.join(messagesDir, `${locale}.json`);
    fs.writeFileSync(filePath, `${JSON.stringify(messageObject, null, 2)}\n`);
    console.log(`pruned ${path.relative(repoRoot, filePath)} (${keysToRemove.length} keys removed)`);
  }
}

function removeMessageKey(target, dottedKey) {
  const parts = dottedKey.split('.');
  return removeMessageKeyRecursive(target, parts, 0);
}

function removeMessageKeyRecursive(target, parts, index) {
  const part = parts[index];

  if (!Object.hasOwn(target, part)) {
    return false;
  }

  if (index === parts.length - 1) {
    delete target[part];
    return true;
  }

  const child = target[part];
  if (!child || typeof child !== 'object' || Array.isArray(child)) {
    return false;
  }

  const changed = removeMessageKeyRecursive(child, parts, index + 1);
  if (!changed) {
    return false;
  }

  if (Object.keys(child).length === 0) {
    delete target[part];
  }

  return true;
}

function printSummary({
  localeDrift,
  localeNames,
  missingKeyRefs,
  missingKeys,
  sourceKeys,
  unresolvedUsages,
  unusedKeys,
  usedKeyList,
  writeMode,
}) {
  console.log('i18n audit summary');
  console.log(`- source locale: ${SOURCE_LOCALE}`);
  console.log(`- locales: ${localeNames.join(', ')}`);
  console.log(`- used keys in source: ${usedKeyList.length}`);
  console.log(`- keys in ${SOURCE_LOCALE}.json: ${sourceKeys.length}`);
  console.log('');

  if (unusedKeys.length === 0) {
    console.log('- no unused keys in source locale');
  } else {
    console.log(`- unused keys in source locale: ${unusedKeys.length}`);
    for (const key of unusedKeys.slice(0, 100)) {
      console.log(`  ${key}`);
    }
    if (unusedKeys.length > 100) {
      console.log(`  ... ${unusedKeys.length - 100} more`);
    }
  }

  if (missingKeys.length === 0) {
    console.log('- no missing keys referenced by source code');
  } else {
    console.log(`- missing keys referenced by source code: ${missingKeys.length}`);
    for (const key of missingKeys.slice(0, 100)) {
      const refs = missingKeyRefs.get(key) ?? [];
      console.log(`  ${key} (${refs.slice(0, 3).join(', ')})`);
    }
    if (missingKeys.length > 100) {
      console.log(`  ... ${missingKeys.length - 100} more`);
    }
  }

  const driftEntries = localeDrift.filter((entry) => entry.extraKeys.length > 0 || entry.missingKeys.length > 0);
  if (driftEntries.length === 0) {
    console.log('- locale files are aligned with the source locale');
  } else {
    console.log('- locale drift');
    for (const entry of driftEntries) {
      console.log(
        `  ${entry.locale}: ${entry.extraKeys.length} extra, ${entry.missingKeys.length} missing compared with ${SOURCE_LOCALE}`,
      );
    }
  }

  if (unresolvedUsages.length === 0) {
    console.log('- no unresolved dynamic translation usages');
  } else {
    console.log(`- unresolved dynamic translation usages: ${unresolvedUsages.length}`);
    for (const usage of unresolvedUsages.slice(0, 100)) {
      const namespaceLabel = usage.namespace ? `${usage.namespace}: ` : '';
      console.log(`  ${usage.location} ${namespaceLabel}${usage.snippet}`);
    }
    if (unresolvedUsages.length > 100) {
      console.log(`  ... ${unresolvedUsages.length - 100} more`);
    }
  }

  if (writeMode) {
    console.log('');
    console.log('write mode completed');
  }
}

function ensureMessageDeclaration(messagePath) {
  const content = fs.readFileSync(messagePath, 'utf8').trim();
  const declarationPath = messagePath.replace(/\.json$/, '.d.json.ts');
  const declaration = `// This file is auto-generated by next-intl, do not edit directly.
// See: https://next-intl.dev/docs/workflows/typescript#messages-arguments

declare const messages: ${content};
export default messages;
`;

  const previous = fs.existsSync(declarationPath) ? fs.readFileSync(declarationPath, 'utf8') : null;
  if (previous !== declaration) {
    fs.writeFileSync(declarationPath, declaration);
  }
}

function unwrapExpression(expression) {
  let current = expression;

  while (
    ts.isAsExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function getStaticStringValue(expression) {
  const current = unwrapExpression(expression);

  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return current.text;
  }

  return null;
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text;
  }

  return null;
}

function isFrontendSourceFile(fileName) {
  return (
    fileName.startsWith(`${frontendSrcRoot}${path.sep}`) &&
    !fileName.endsWith('.d.ts') &&
    (fileName.endsWith('.ts') || fileName.endsWith('.tsx'))
  );
}

function formatLocation(node) {
  const sourceFile = node.getSourceFile();
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${path.relative(repoRoot, sourceFile.fileName)}:${line + 1}:${character + 1}`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatDiagnostic(diagnostic) {
  if (!diagnostic.file || diagnostic.start == null) {
    return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  }

  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  return `${diagnostic.file.fileName}:${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`;
}

function uniqueStrings(values) {
  return Array.from(new Set(values));
}
