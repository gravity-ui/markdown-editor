import {mGptPlugin as createPlugin} from '@gravity-ui/markdown-editor-gpt-extension/markup';

import {ReactRendererFacet} from '../../../../markup/codemirror/react-facet';
import type {CommonAnswer} from '../ErrorScreen/types';
import type {GptWidgetOptions} from '../types';
export function mGptPlugin<A extends CommonAnswer = CommonAnswer, P = unknown>(
    props: GptWidgetOptions<A, P>,
) {
    return createPlugin(props, {getRenderer: (state) => state.facet(ReactRendererFacet)});
}
