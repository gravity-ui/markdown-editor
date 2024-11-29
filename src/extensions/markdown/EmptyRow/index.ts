import {ExtensionAuto} from '../../../core';
import {CommandMenuOptions} from '../../behavior/CommandMenu';

import {emptyRowPlugin} from './emptyRowPlugin';

export const EmptyRow: ExtensionAuto<CommandMenuOptions> = (builder, opts) => {
    builder.addPlugin((deps) => emptyRowPlugin(deps, opts));
};
