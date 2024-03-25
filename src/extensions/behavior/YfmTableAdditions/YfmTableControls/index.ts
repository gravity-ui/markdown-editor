import {Extension} from '../../../../core';

import {tableControlsPlugin} from './buttons';

export {tableControlsPlugin} from './buttons';

// TODO: split: plus buttons extenion & cell controls extension
export const YfmTableControlsExtension: Extension = (builder) => {
    builder.addPlugin(tableControlsPlugin);
};
