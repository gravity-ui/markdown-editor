import {ExtensionAuto} from '../../../core';

import {tableControlsPlugin} from './YfmTableControls';

export const YfmTableAdditions: ExtensionAuto = (builder) => {
    builder.addPlugin(tableControlsPlugin);
};
