import type {Node} from 'prosemirror-model';
import type {EditorState} from 'prosemirror-state';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

import {getReactRendererFromState} from '../../../extensions/behavior/ReactRenderer';
import {createResourceIndicator, destroyResourceIndicator} from '../indicator';
import type {ReplacementResource} from '../types';

import {collectResourcesInRanges} from './collect-resources';
import type {ResourceReplacementState} from './types';

function calculateIndicatorSize(
    node: Node,
    image: HTMLImageElement | null,
    rect: DOMRect | undefined,
    limit: number,
) {
    const dimension = (value: unknown, fallback: number) => {
        if (typeof value === 'string' && value.endsWith('%'))
            return (parseFloat(value) * limit) / 100 || fallback;
        return Number(value) > 0 ? Number(value) : fallback;
    };
    let width = rect?.width || dimension(node.attrs.width, image?.naturalWidth || 160);
    let height = rect?.height || dimension(node.attrs.height, image?.naturalHeight || 100);
    const scale = Math.min(1, limit / width, 700 / height);
    width *= scale;
    height *= scale;
    return {width, height};
}

function createPendingResourceIndicator(
    view: EditorView,
    state: EditorState,
    from: number,
    resource: ReplacementResource,
) {
    const node = state.doc.nodeAt(from)!;
    const dom = view.nodeDOM(from);
    const image = dom instanceof HTMLElement ? dom.querySelector('img') : null;
    const rect = dom instanceof HTMLElement ? (image ?? dom).getBoundingClientRect() : undefined;
    let renderer;
    try {
        renderer = getReactRendererFromState(view.state);
    } catch {
        /* Standalone editors may omit React. */
    }
    const limit = view.dom.clientWidth || 1600;
    const size = calculateIndicatorSize(node, image, rect, limit);
    return createResourceIndicator(
        resource,
        renderer,
        node.type.name === 'image' ? size : undefined,
    );
}

export function createResourceDecorations(state: EditorState, batches: ResourceReplacementState) {
    const decorations: Decoration[] = [];
    for (const batch of batches) {
        for (const [index, {from, to, resource}] of collectResourcesInRanges(
            state,
            batch.ranges,
        ).entries()) {
            decorations.push(
                Decoration.node(from, to, {
                    style: 'display: none',
                    'aria-hidden': 'true',
                }),
            );
            decorations.push(
                Decoration.widget(
                    from,
                    (view) => createPendingResourceIndicator(view, state, from, resource),
                    {
                        key: `${batch.id}:${index}`,
                        side: -1,
                        destroy: (dom) => destroyResourceIndicator(dom as HTMLElement),
                    },
                ),
            );
        }
    }
    return DecorationSet.create(state.doc, decorations);
}
