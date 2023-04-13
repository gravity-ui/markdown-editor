import type {ActionSpec} from '../../../core';
import {toHeading} from './commands';
import {HeadingLevel} from './const';
import {hasParentHeading} from './YfmHeadingSpecs/utils';

export const headingAction = (level: HeadingLevel): ActionSpec => {
    const cmd = toHeading(level);
    return {
        isActive: hasParentHeading(level),
        isEnable: cmd,
        run: cmd,
    };
};
