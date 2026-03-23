import type {NodeType} from 'prosemirror-model';

import type {ActionSpec} from '../../../core';

import {toHeading} from './commands';
import type {HeadingLevel} from './const';
import {hasParentHeading} from './utils';

export const headingAction = (_nodeType: NodeType, level: HeadingLevel): ActionSpec => {
    const cmd = toHeading(level);
    return {
        isActive: hasParentHeading(level),
        isEnable: cmd,
        run: cmd,
    };
};
