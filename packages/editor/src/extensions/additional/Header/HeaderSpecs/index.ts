import type {ExtensionAuto} from '#core';

import {headerDomAttrs, headerHeightDataAttr, normalizeHeaderHeight} from './attrs';
import {
    HEADER_DEFAULT_HEIGHT,
    HeaderAttr,
    headerClassName,
    headerDirectiveName,
    headerNodeName,
    headerTokenName,
} from './const';
import {headerDirective} from './md';

export * from './attrs';
export * from './const';
export {headerDirective} from './md';

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerDirective))
        .addNodeSpec(headerNodeName, () => ({
            atom: true,
            group: 'block',
            selectable: true,
            attrs: {[HeaderAttr.Height]: {default: HEADER_DEFAULT_HEIGHT}},
            parseDOM: [
                {
                    tag: `div.${headerClassName}`,
                    getAttrs: (dom) => ({
                        [HeaderAttr.Height]: normalizeHeaderHeight(
                            (dom as Element).getAttribute(headerHeightDataAttr),
                        ),
                    }),
                },
            ],
            toDOM: (node) => ['div', headerDomAttrs(node.attrs[HeaderAttr.Height])],
        }))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'node',
            getAttrs: (token) => ({[HeaderAttr.Height]: token.attrGet(headerHeightDataAttr)}),
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            state.write(
                `:::${headerDirectiveName}{${HeaderAttr.Height}=${node.attrs[HeaderAttr.Height]}}`,
            );
            // Закрытый блок отделяется от следующей записи пустой строкой.
            state.closeBlock(node);
            state.write(':::');
            state.closeBlock(node);
        });
};
