import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';

import ts from 'typescript';

import {NOT_FOUND, NOT_RECOGNIZED} from '../markdown.mjs';
import {resolveDeclaration} from '../symbols.mjs';
import {asFunction, objectProperty, unwrapExpression} from '../syntax.mjs';

/** `<name>ItemView` holds the title, `<name>ItemWysiwyg` holds the action; some WYSIWYG items are spelled `Wisywig`. */
const ITEM_NAME = /^(\w+)Item(View|Wysiwyg|Wisywig)$/;
const KEYSET_FILE = 'en.json';

/** Reads the i18n function and the key of `title: i18n.bind(null, '<key>')` or `title: () => i18n('<key>')`. */
function titleCall(object) {
    const title = objectProperty(object, 'title');
    if (!title?.initializer) return null;

    const value = unwrapExpression(title.initializer);
    const fn = asFunction(value);
    const call = fn ? unwrapExpression(fn.body) : value;
    if (!call || !ts.isCallExpression(call)) return null;

    const callee = call.expression;
    const isBind =
        ts.isPropertyAccessExpression(callee) &&
        callee.name.text === 'bind' &&
        ts.isIdentifier(callee.expression);
    const i18n = isBind ? callee.expression : callee;
    const key = isBind ? call.arguments[1] : call.arguments[0];

    return ts.isIdentifier(i18n) && key && ts.isStringLiteralLike(key)
        ? {i18n, key: key.text}
        : null;
}

/** Reads `<name>` from the first `<editor>.actions.<name>` inside the object, nested objects excluded. */
function actionName(object) {
    let name = null;
    const visit = (node) => {
        if (name || ts.isObjectLiteralExpression(node)) return;
        if (
            ts.isPropertyAccessExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            node.expression.name.text === 'actions'
        ) {
            name = node.name.text;
            return;
        }
        ts.forEachChild(node, visit);
    };
    object.properties.forEach((member) => ts.forEachChild(member, visit));

    return name;
}

/** Reads the English keyset placed next to the module that declares the i18n function. */
function keyset(index, i18n) {
    const declaration = resolveDeclaration(index.checker, i18n);
    if (!declaration) return null;

    const file = join(dirname(declaration.getSourceFile().fileName), KEYSET_FILE);
    if (!index.keysets.has(file)) {
        index.keysets.set(file, existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null);
    }

    return index.keysets.get(file);
}

/** Records the view and the WYSIWYG parts of toolbar items by item name. */
export function collectToolbarItem(node, {index}) {
    if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name)) return;

    const match = node.name.text.match(ITEM_NAME);
    const object = unwrapExpression(node.initializer);
    if (!match || !object || !ts.isObjectLiteralExpression(object)) return;

    const [, name, mode] = match;
    const part = index.toolbarParts.get(name) ?? {};
    if (mode === 'View') part.title = titleCall(object);
    else part.action = actionName(object);
    index.toolbarParts.set(name, part);
}

/** Reads the English title of a toolbar item. */
function titleText(index, title) {
    if (!title) return NOT_RECOGNIZED;

    return keyset(index, title.i18n)?.[title.key] ?? NOT_FOUND;
}

/** Builds the toolbar titles of every action from the recorded item parts. */
export function toolbarItemsByAction(index) {
    const items = new Map();
    for (const {title, action} of index.toolbarParts.values()) {
        if (!action) continue;
        items.set(action, [...(items.get(action) ?? []), titleText(index, title)]);
    }

    return items;
}
