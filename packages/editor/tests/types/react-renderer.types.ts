import type {EditorState as MarkupState} from '@codemirror/state';
import type {EditorState as WysiwygState} from 'prosemirror-state';

import type * as PublicPackage from '../../src';
import {
    type ReactRenderer,
    ReactRendererFacet,
    type RendererItem,
    getReactRendererFromState,
} from '../../src/react-renderer';

export function shouldShareRendererContracts(wysiwyg: WysiwygState, markup: MarkupState) {
    const wysiwygRenderer: ReactRenderer = getReactRendererFromState(wysiwyg);
    const markupRenderer: ReactRenderer = markup.facet(ReactRendererFacet);
    const existingRenderer: PublicPackage.ReactRenderer = wysiwygRenderer;
    const existingFacet: typeof PublicPackage.ReactRendererFacet = ReactRendererFacet;
    const existingGetter: typeof PublicPackage.getReactRendererFromState =
        getReactRendererFromState;
    const item: RendererItem = markupRenderer.createItem('external-extension', () => null);

    item.rerender();
    item.remove();
    markupRenderer.removeItem(item);
    markupRenderer.removeItem(item.id);

    // @ts-expect-error WYSIWYG renderers require a ProseMirror state.
    getReactRendererFromState(markup);
    // @ts-expect-error Render callbacks must return React nodes.
    markupRenderer.createItem('invalid', () => ({invalid: true}));

    return {existingRenderer, existingFacet, existingGetter};
}
