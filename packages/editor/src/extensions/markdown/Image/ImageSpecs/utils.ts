import type {Node} from 'prosemirror-model';

import type {SerializerNodeToken} from '#core';

import {ImageAttr} from './const';

export type ImageToMarkdownParams = {
    /** Extra content to append before the closing ')'. Receives state and node, returns string. */
    renderExtra?: (state: Parameters<SerializerNodeToken>[0], node: Node) => string;
};

export function imageToMarkdown({renderExtra}: ImageToMarkdownParams = {}): SerializerNodeToken {
    return (state, node) => {
        const {attrs} = node;
        let result = '![';

        if (attrs[ImageAttr.Alt]) result += state.esc(attrs[ImageAttr.Alt]);

        result += '](';

        if (attrs[ImageAttr.Src]) result += state.esc(attrs[ImageAttr.Src]);

        if (attrs[ImageAttr.Title]) result += ` ${state.quote(attrs[ImageAttr.Title])}`;

        if (renderExtra) result += renderExtra(state, node);

        result += ')';

        state.write(result);
    };
}
