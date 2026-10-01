import type {ExtensionAuto} from '#core';

import {escapeHeaderTitle, normalizeHeaderAttrs, serializeHeaderAttrs} from './attrs';
import {
    headerActionsName,
    headerContentName,
    headerNodeName,
    headerTitleName,
    headerTokenName,
} from './const';
import {headerDirective} from './md/header';
import {
    getHeaderSchemaSpec,
    getHeaderTitleSpec,
    headerActionSpec,
    headerActionsSpec,
    headerContentSpec,
} from './schema';

export * from './attrs';
export * from './const';
export * from './decor';
export {headerHtml, toCssUrl} from './dom';
export {headerDirective} from './md/header';

const stripDataPrefix = (attrs: [string, string][]) =>
    Object.fromEntries(attrs.map(([name, value]) => [name.replace(/^data-/, ''), value]));

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder.configureMd((md) => md.use(headerDirective));

    builder
        .addNodeSpec(headerNodeName, () => getHeaderSchemaSpec())
        .addNodeSpec(headerTitleName, () => getHeaderTitleSpec(builder.context.get('placeholder')))
        .addNodeSpec(headerContentName, () => headerContentSpec)
        .addNodeSpec(headerActionsName, () => headerActionsSpec)
        .addNodeSpec('header_action', () => headerActionSpec)
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            getAttrs: (token) => normalizeHeaderAttrs(stripDataPrefix(token.attrs ?? [])),
        }))
        .addMarkdownTokenParserSpec(headerTitleName, () => ({name: headerTitleName, type: 'block'}))
        .addMarkdownTokenParserSpec(headerContentName, () => ({
            name: headerContentName,
            type: 'block',
        }))
        .addMarkdownTokenParserSpec(headerActionsName, () => ({
            name: headerActionsName,
            type: 'block',
        }))
        .addMarkdownTokenParserSpec('action', () => ({
            name: 'header_action',
            type: 'block',
            noCloseToken: true,
            getAttrs: (token) => {
                const attrs = Object.fromEntries(token.attrs ?? []);
                return {href: attrs.href, type: attrs['data-type'], color: attrs['data-color']};
            },
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            const title = escapeHeaderTitle(node.firstChild?.textContent ?? '');
            state.write(`:::header[${title}]${serializeHeaderAttrs(node.attrs)}\n\n`);
            state.renderContent(node);
            state.write(':::');
            state.closeBlock(node);
        })
        .addNodeSerializerSpec(headerTitleName, () => () => {})
        .addNodeSerializerSpec(headerContentName, () => (state, node) => {
            state.renderContent(node);
        })
        .addNodeSerializerSpec(headerActionsName, () => (state, node) => {
            state.renderContent(node);
        })
        .addNodeSerializerSpec('header_action', () => (state, node) => {
            const href = String(node.attrs.href ?? '');
            const title = escapeHeaderTitle(node.textContent);
            const type = String(node.attrs.type ?? 'button');
            const color = String(node.attrs.color ?? 'default');
            state.write(`::action[${title}](${href}){type="${type}" color="${color}"}`);
            state.closeBlock(node);
        });
};
