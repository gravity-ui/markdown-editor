import {gptWidgetPlugin as createPlugin} from '@gravity-ui/markdown-editor-gpt-extension/wysiwyg';

import {getReactRendererFromState} from '../../behavior/ReactRenderer';

import type {CommonAnswer} from './ErrorScreen/types';
import type {GptWidgetDecoViewParams} from './gptExtension/view';
export {pluginKey, type GptWidgetMeta} from './plugin-key';
export const gptWidgetPlugin = <A extends CommonAnswer = CommonAnswer, P = unknown>(
    params: GptWidgetDecoViewParams<A, P>,
) => createPlugin({...params, getRenderer: getReactRendererFromState});
