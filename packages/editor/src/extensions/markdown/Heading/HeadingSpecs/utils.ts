import type {SerializerNodeToken} from '#core';

import {headingLevelAttr} from './const';

type HeadingToMarkdownParams = {
    renderMarkup?: SerializerNodeToken;
    renderAttributes?: SerializerNodeToken;
};

const defaultMarkupRender: SerializerNodeToken = (state, node) =>
    state.write(state.repeat('#', node.attrs[headingLevelAttr]) + ' ');

export function headingToMarkdown({
    renderMarkup = defaultMarkupRender,
    renderAttributes,
}: HeadingToMarkdownParams = {}): SerializerNodeToken {
    return (...args) => {
        const [state, node] = args;
        renderMarkup(...args);
        const escapeHashOnlyHeading =
            node.content.content.every((child) => child.isText) &&
            /^#+[ \t]*$/.test(node.textContent);
        state.renderInline(node, escapeHashOnlyHeading);
        renderAttributes?.(...args);
        state.closeBlock(node);
    };
}
