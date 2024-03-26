import {ExtensionAuto} from '../../../core';

import {yfmNoteTooltipPlugin} from './TooltipPlugin';

export const YfmNoteTooltip: ExtensionAuto = (builder) => {
    builder.addPlugin(yfmNoteTooltipPlugin);
};
