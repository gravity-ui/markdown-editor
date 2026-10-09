import type {ActionSpec} from '#core';
import type {NodeType} from '#pm/model';
import {headingAction as headingActionBase} from 'src/extensions/markdown/Heading/actions';

import type {HeadingLevel} from './const';

export const headingAction = (level: HeadingLevel): ActionSpec =>
    headingActionBase({} as NodeType, level);
