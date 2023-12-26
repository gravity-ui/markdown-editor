import type {ActionSpec} from '../../../core';

import {hasParentHeading} from './YfmHeadingSpecs/utils';
import {toHeading} from './commands';
import {HeadingLevel} from './const';

export const headingAction = (level: HeadingLevel): ActionSpec => {
    const cmd = toHeading(level);
    return {
        isActive: hasParentHeading(level),
        isEnable: cmd,
        run: cmd,
    };
};
