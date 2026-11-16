import {createGptExtension, gptActionName} from '@gravity-ui/markdown-editor-gpt-extension/wysiwyg';

import type {Action, ExtensionBuilder} from '../../../../core';
import {getReactRendererFromState} from '../../../behavior/ReactRenderer';
import type {CommonAnswer} from '../ErrorScreen/types';
import type {GptWidgetOptions} from '../types';

export type {GptWidgetOptions};
export {gptActionName};
export const gptExtension: <A extends CommonAnswer = CommonAnswer, P = unknown>(
    builder: ExtensionBuilder,
    options: GptWidgetOptions<A, P>,
) => void = createGptExtension(getReactRendererFromState);

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [gptActionName]: Action<{}>;
        }
    }
}
