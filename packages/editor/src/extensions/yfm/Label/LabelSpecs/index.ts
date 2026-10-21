import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

import {
    LabelAttr,
    defaultLabelColor,
    labelColorDomAttr,
    labelDirectiveName,
    labelNodeName,
} from './const';
import {labelPlugin} from './plugin';
import {labelNodeSpec} from './schema';
import {escapeLabelText, normalizeLabelColor} from './utils';

export {
    LabelAttr,
    LabelColor,
    defaultLabelColor,
    labelCn,
    labelColors,
    labelNodeName,
    labelThemes,
} from './const';
export {labelPlugin} from './plugin';
export {labelNodeSpec} from './schema';
export {normalizeLabelColor} from './utils';

export const labelType = nodeTypeFactory(labelNodeName);

export const LabelSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(labelPlugin))
        .addNodeSpec(labelNodeName, () => labelNodeSpec)
        .addMarkdownTokenParserSpec(labelNodeName, () => ({
            name: labelNodeName,
            type: 'node',
            getAttrs: (token) => ({
                [LabelAttr.Text]: token.content,
                [LabelAttr.Color]: normalizeLabelColor(token.attrGet(labelColorDomAttr)),
            }),
        }))
        .addNodeSerializerSpec(labelNodeName, () => (state, node) => {
            const color = normalizeLabelColor(node.attrs[LabelAttr.Color]);
            const text = escapeLabelText(node.attrs[LabelAttr.Text]);
            const attrs = color === defaultLabelColor ? '' : `{${LabelAttr.Color}=${color}}`;

            state.write(`:${labelDirectiveName}[${text}]${attrs}`);
        });
};
