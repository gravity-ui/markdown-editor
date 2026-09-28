import type {ExtensionAuto} from '#core';

import {escapeHeaderTitle, normalizeHeaderAttrs, serializeHeaderAttrs} from './attrs';
import {headerDirectiveName, headerNodeName, headerTokenName} from './const';
import {headerDirective} from './md/header';
import {getHeaderSchemaSpec} from './schema';

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
        .addNodeSpec(headerNodeName, () => getHeaderSchemaSpec(builder.context.get('placeholder')))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            noCloseToken: true,
            getAttrs: (token) => normalizeHeaderAttrs(stripDataPrefix(token.attrs ?? [])),
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            const title = escapeHeaderTitle(node.textContent);
            state.write(`::${headerDirectiveName}[${title}]${serializeHeaderAttrs(node.attrs)}`);
            state.closeBlock(node);
        });
};
