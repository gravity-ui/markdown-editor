import type {CommonAnswer, GptWidgetOptions} from '@gravity-ui/markdown-editor-gpt-extension';
import {mGptPlugin as createPlugin} from '@gravity-ui/markdown-editor-gpt-extension/MarkupGpt/plugin';

import {ReactRendererFacet} from '../../../../react-renderer';

export function mGptPlugin<A extends CommonAnswer, P>(props: GptWidgetOptions<A, P>) {
    return createPlugin(props, {getRenderer: (state) => state.facet(ReactRendererFacet)});
}
