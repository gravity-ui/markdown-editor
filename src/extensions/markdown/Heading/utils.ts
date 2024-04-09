import type {NodeType} from 'prosemirror-model';
import type {EditorState} from 'prosemirror-state';
import {hasParentNode} from 'prosemirror-utils';

import {textblockTypeInputRule} from '../../../utils/inputrules';

import {headingType} from './HeadingSpecs';
import {HeadingLevel, headingLevelAttr} from './const';

/** @deprecated Use `headingType` instead */
export const hType = headingType;

export const hasParentHeading = (level: HeadingLevel) => (state: EditorState) =>
    hasParentNode((node) => {
        return node.type === headingType(state.schema) && node.attrs[headingLevelAttr] === level;
    })(state.selection);

// Given a node type and a maximum level, creates an input rule that
// turns up to that number of `#` characters followed by a space at
// the start of a textblock into a heading whose level corresponds to
// the number of `#` signs.
export function headingRule(nodeType: NodeType, maxLevel: HeadingLevel) {
    return textblockTypeInputRule(
        new RegExp('^(#{1,' + maxLevel + '})\\s$'),
        nodeType,
        (match) => ({[headingLevelAttr]: match[1].length}),
    );
}
