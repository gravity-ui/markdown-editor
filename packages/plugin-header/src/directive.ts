import {
    type ContainerDirectiveParams,
    directiveParser,
    registerContainerDirective,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerClassName, headerSourceTokenName, headerTokenName} from './const';
import {headerDimensions, isHeaderHeight, isHeaderWidth} from './dimensions';

export function headerDomAttrs(attrs: {height?: unknown; width?: unknown}) {
    const {height, width} = headerDimensions(attrs);
    return {class: headerClassName, 'data-height': height, 'data-width': width};
}

function isHeaderAttr([name, value]: [string, unknown]) {
    return (
        (name === 'height' && isHeaderHeight(value)) || (name === 'width' && isHeaderWidth(value))
    );
}

function isSupported({
    attrs = {},
    inlineContent,
    dests,
    contentTitle,
    content,
}: ContainerDirectiveParams) {
    return (
        !inlineContent &&
        !dests &&
        !contentTitle &&
        !content.raw.trim() &&
        Object.entries(attrs).every(isHeaderAttr)
    );
}

export const headerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());

    registerContainerDirective(md, 'header', (state, params) => {
        const {startLine, endLine} = params;
        if (isSupported(params)) {
            const token = state.push(`${headerTokenName}_open`, 'div', 1);
            token.attrs = Object.entries(headerDomAttrs(params.attrs ?? {}));
            token.map = [startLine, endLine];
            state.push(`${headerTokenName}_close`, 'div', -1);
        } else {
            // Verbatim source keeps the markup unchanged after a round trip through WYSIWYG.
            const token = state.push(headerSourceTokenName, 'pre', 0);
            token.content = state.getLines(startLine, endLine, state.blkIndent, false);
            token.map = [startLine, endLine];
        }
        return true;
    });

    md.renderer.rules[headerSourceTokenName] = (tokens, index) =>
        `<pre><code>${md.utils.escapeHtml(tokens[index].content)}</code></pre>\n`;
};
