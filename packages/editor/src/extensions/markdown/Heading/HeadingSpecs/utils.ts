import type {SerializerNodeToken} from '#core';
import {Fragment} from '#pm/model';

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
        const content = node.content.content.map((child) => {
            if (!child.isText || !child.text) return child;
            const text = child.text.replace(/\r\n?|\n/g, ' ');
            return text === child.text ? child : node.type.schema.text(text, child.marks);
        });
        const normalizedNode = node.copy(Fragment.fromArray(content));
        const escapeHashOnlyHeading =
            normalizedNode.content.content.every((child) => child.isText) &&
            /^#+[ \t]*$/.test(normalizedNode.textContent);
        state.renderInline(normalizedNode, escapeHashOnlyHeading);
        renderAttributes?.(...args);
        state.closeBlock(node);
    };
}
