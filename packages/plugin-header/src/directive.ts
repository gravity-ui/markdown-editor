import {
    type ContainerDirectiveParams,
    directiveParser,
    registerContainerDirective,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerClassNames} from './classname';
import {headerTokenName} from './const';
import {type HeaderDimensions, headerDimensions} from './dimensions';

/** Meta of the `header_open` token. */
export type HeaderMeta = HeaderDimensions & {
    /** Markdown of a block with text inside or a title; the text is not rendered. */
    source: string | null;
};

function hasText({inlineContent, dests, contentTitle, content}: ContainerDirectiveParams) {
    return Boolean(inlineContent || dests || contentTitle || content.raw.trim());
}

export const headerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());

    registerContainerDirective(md, 'header', (state, params) => {
        const {startLine, endLine} = params;
        const dimensions = headerDimensions(params.attrs ?? {});
        const meta: HeaderMeta = {
            ...dimensions,
            source: hasText(params)
                ? state.getLines(startLine, endLine, state.blkIndent, false)
                : null,
        };
        const token = state.push(`${headerTokenName}_open`, 'div', 1);
        token.attrSet('class', headerClassNames(dimensions));
        token.meta = meta;
        token.map = [startLine, endLine];
        state.push(`${headerTokenName}_close`, 'div', -1);
        return true;
    });
};
