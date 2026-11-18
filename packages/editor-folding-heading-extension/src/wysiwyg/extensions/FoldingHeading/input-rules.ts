import {InputRule} from '@gravity-ui/markdown-editor/_/pm/inputrules.js';
import {hasCodeMark} from '@gravity-ui/markdown-editor/_/utils/inputrules.js';
import type {NodeType} from '@gravity-ui/markdown-editor/pm/model';
import {pType} from '@gravity-ui/markdown-editor/specs';

import {FoldingHeadingAttr, type HeadingLevel, YfmHeadingAttr} from './const';
import {isFoldingHeading, isHeading, parseLevel} from './utils';

export function foldingHeadingRule(nodeType: NodeType, maxLevel: HeadingLevel) {
    return new InputRule(
        new RegExp('^(#{1,' + maxLevel + '})\\+\\s$'),
        (state, match, start, end) => {
            if (hasCodeMark(state, match, start, end)) return null;

            const $start = state.doc.resolve(start);
            if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType))
                return null;

            const level = match[1].length;

            const pos = $start.before();
            const tr = state.tr.delete(start, end);

            if (!isHeading($start.parent)) tr.setNodeMarkup(pos, nodeType);
            tr.setNodeAttribute(pos, YfmHeadingAttr.Level, level);
            tr.setNodeAttribute(pos, FoldingHeadingAttr.Folding, false);

            // insert empty paragraph if content of new folding heading is empty
            const nextNode = $start.node(-1).maybeChild($start.indexAfter(-1));
            if (!nextNode || (isFoldingHeading(nextNode) && parseLevel(nextNode) <= level)) {
                tr.insert(tr.mapping.map($start.after()), pType(state.schema).create());
            }

            return tr;
        },
    );
}
