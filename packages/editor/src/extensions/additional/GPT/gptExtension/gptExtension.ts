import {createGptExtension, gptActionName} from '@gravity-ui/markdown-editor-gpt-extension';

import type {Action} from '../../../../core';
import {getReactRendererFromState} from '../../../../react-renderer';

export type {GptWidgetOptions} from '@gravity-ui/markdown-editor-gpt-extension';
export {gptActionName};
export const gptExtension = createGptExtension(getReactRendererFromState);

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [gptActionName]: Action<{}>;
        }
    }
}
