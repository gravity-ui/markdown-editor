import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

import {
    StatusAttr,
    defaultStatusColor,
    statusColorDomAttr,
    statusDirectiveName,
    statusNodeName,
} from './const';
import {statusPlugin} from './plugin';
import {statusNodeSpec} from './schema';
import {escapeStatusText, normalizeStatusColor} from './utils';

export {
    StatusAttr,
    StatusColor,
    defaultStatusColor,
    statusCn,
    statusColors,
    statusNodeName,
} from './const';
export {statusPlugin} from './plugin';
export {statusNodeSpec} from './schema';
export {normalizeStatusColor} from './utils';

export const statusType = nodeTypeFactory(statusNodeName);

export const StatusSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(statusPlugin))
        .addNodeSpec(statusNodeName, () => statusNodeSpec)
        .addMarkdownTokenParserSpec(statusNodeName, () => ({
            name: statusNodeName,
            type: 'node',
            getAttrs: (token) => ({
                [StatusAttr.Text]: token.content,
                [StatusAttr.Color]: normalizeStatusColor(token.attrGet(statusColorDomAttr)),
            }),
        }))
        .addNodeSerializerSpec(statusNodeName, () => (state, node) => {
            const color = normalizeStatusColor(node.attrs[StatusAttr.Color]);
            const text = escapeStatusText(node.attrs[StatusAttr.Text]);
            const attrs = color === defaultStatusColor ? '' : `{${StatusAttr.Color}=${color}}`;

            state.write(`:${statusDirectiveName}[${text}]${attrs}`);
        });
};
