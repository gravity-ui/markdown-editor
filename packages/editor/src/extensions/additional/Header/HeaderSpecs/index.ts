import type {ExtensionAuto} from '#core';

import {headerMarkupAttr, headerNodeName, headerTokenName} from './const';
import {headerStubPlugin} from './md/stub';
import {headerStubSpec} from './schema';

export * from './attrs';
export * from './const';
export * from './decor';
export {toCssUrl, toSafeUrl} from './dom';
export {headerDirective} from './md/header';
export {headerStubPlugin} from './md/stub';

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerStubPlugin))
        .addNodeSpec(headerNodeName, () => headerStubSpec)
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'node',
            getAttrs: (token) => ({[headerMarkupAttr]: token.content}),
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            String(node.attrs[headerMarkupAttr])
                .split('\n')
                .forEach((line, index) => {
                    if (index) state.out += '\n';
                    state.write(line);
                    // Пустая строка в списке или цитате — без хвостовых пробелов, как между блоками.
                    if (!line) state.out = state.out.replace(/[ \t]+$/, '');
                });
            state.closeBlock(node);
        });
};
