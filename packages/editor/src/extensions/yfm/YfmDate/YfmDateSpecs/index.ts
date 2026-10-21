import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

import {DateAttr, dateDirectiveName, dateNodeName} from './const';
import {datePlugin} from './plugin';
import {dateNodeSpec} from './schema';

export {DateAttr, dateCn, dateNodeName} from './const';
export {datePlugin} from './plugin';
export {dateNodeSpec} from './schema';
export {formatDisplayDate, getTodayIsoDate, isIsoDate, parseIsoDate} from './utils';
export type {CalendarDay} from './utils';

export const dateType = nodeTypeFactory(dateNodeName);

export const YfmDateSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(datePlugin))
        .addNodeSpec(dateNodeName, () => dateNodeSpec)
        .addMarkdownTokenParserSpec(dateNodeName, () => ({
            name: dateNodeName,
            type: 'node',
            getAttrs: (token) => ({[DateAttr.Date]: token.content}),
        }))
        .addNodeSerializerSpec(dateNodeName, () => (state, node) => {
            state.write(`:${dateDirectiveName}[${node.attrs[DateAttr.Date]}]`);
        });
};
