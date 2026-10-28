import {mGptExtension as createGptExtension} from '@gravity-ui/markdown-editor-gpt-extension';

import {ReactRendererFacet} from '../../../../react-renderer';
import type {CommonAnswer} from '../ErrorScreen/types';
import type {GptWidgetOptions} from '../gptExtension/gptExtension';

export {mGptToolbarItem} from './toolbar';
export {showMarkupGpt, hideMarkupGpt} from './commands';

export function mGptExtension<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(props: GptWidgetOptions<AnswerData, PromptData>) {
    return createGptExtension(props, {getRenderer: (state) => state.facet(ReactRendererFacet)});
}
