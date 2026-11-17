import {
    type GptWidgetDecoViewParams as PackageParams,
    GptWidgetDecoView as PackageView,
} from '@gravity-ui/markdown-editor-gpt-extension/compatibility';
import type {EditorView} from 'prosemirror-view';

import {getReactRendererFromState} from '../../../behavior/ReactRenderer';
import type {CommonAnswer} from '../ErrorScreen/types';
export {cnGptPopup} from '@gravity-ui/markdown-editor-gpt-extension/compatibility';
export type GptWidgetDecoViewParams<A extends CommonAnswer = CommonAnswer, P = unknown> = Omit<
    PackageParams<A, P>,
    'getRenderer'
>;
export class GptWidgetDecoView<
    A extends CommonAnswer = CommonAnswer,
    P = unknown,
> extends PackageView<A, P> {
    constructor(view: EditorView, params: GptWidgetDecoViewParams<A, P>) {
        super(view, {...params, getRenderer: getReactRendererFromState});
    }
}
