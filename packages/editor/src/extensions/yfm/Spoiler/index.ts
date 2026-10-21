import type {Action, ExtensionAuto} from '../../../core';
import {createToggleMarkAction} from '../../../utils/actions';

import {SpoilerSpecs, spoilerType} from './SpoilerSpecs';
import {spoilerAction} from './const';
import {spoilerEditingPlugin} from './plugins/editing';

import '../../../styles/yfm-spoiler.scss';

export {SpoilerClassName, spoilerMarkName, spoilerType} from './SpoilerSpecs';

export const Spoiler: ExtensionAuto = (builder) => {
    builder.use(SpoilerSpecs);

    builder
        .addAction(spoilerAction, ({schema}) => createToggleMarkAction(spoilerType(schema)))
        .addPlugin(spoilerEditingPlugin);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [spoilerAction]: Action;
        }
    }
}
