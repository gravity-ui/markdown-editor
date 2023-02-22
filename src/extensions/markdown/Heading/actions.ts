import {setBlockType} from 'prosemirror-commands';
import type {NodeType} from 'prosemirror-model';
import type {ActionSpec} from '../../../core';
import {HeadingLevel, headingLevelAttr} from './const';
import {hasParentHeading} from './utils';

export const headingAction = (nodeType: NodeType, level: HeadingLevel): ActionSpec => {
    const cmd = setBlockType(nodeType, {[headingLevelAttr]: level});
    return {
        isActive: hasParentHeading(level),
        isEnable: cmd,
        run: cmd,
    };
};
