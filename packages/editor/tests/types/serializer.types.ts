import type {Node} from 'prosemirror-model';

import type {SerializerState} from '../../src/core';

export function shouldAcceptInlineRenderingOptions(state: SerializerState, node: Node) {
    state.renderInline(node);
    state.renderInline(node, false);
    state.renderInline(node, {atBlockStart: false});
    state.renderInline(node, {textLineBreaks: 'space'});
    state.renderInline(node, {textLineBreaks: 'preserve', atBlockStart: true});
    // @ts-expect-error Only supported text line break modes are accepted.
    state.renderInline(node, {textLineBreaks: 'remove'});
    // @ts-expect-error The block-start option must be a boolean.
    state.renderInline(node, {atBlockStart: 'false'});
}
