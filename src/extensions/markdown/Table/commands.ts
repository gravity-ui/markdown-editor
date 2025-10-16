import type {Command} from '#pm/state';

import {isIntoTable} from './helpers';

export const ignoreIfInTableCell: Command = isIntoTable;
