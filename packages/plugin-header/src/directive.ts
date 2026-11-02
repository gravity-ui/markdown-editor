import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';

import {parseDirectiveAttrs} from './attrs';
import {headerDomAttrs, headerTokenName, isHeaderHeight, isHeaderWidth} from './dimensions';

export const headerOpening = /^:::header(?=$|[\s{[])/;

export function blockLine(state: StateBlock, line: number) {
    return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

export function headerDirective(md: MarkdownIt) {
    md.use(directiveParser());

    registerContainerDirective(md, headerTokenName, (state, params) => {
        const closing = params.endLine - 1;
        if (!/^:::header(?:\{|[ \t]*$)/.test(blockLine(state, params.startLine))) return false;
        if (blockLine(state, closing).trim() !== ':::') return false;
        if (state.sCount[closing] - state.blkIndent >= 4) return false;
        for (let line = params.startLine + 1; line <= closing; line++) {
            if (state.sCount[line] < state.blkIndent && !state.isEmpty(line)) return false;
        }
        if (params.content.raw.trim()) return false;
        const attrs = parseDirectiveAttrs(params, {height: isHeaderHeight, width: isHeaderWidth});
        if (!attrs) return false;

        const open = state.push(`${headerTokenName}_open`, 'div', 1);
        open.attrs = Object.entries(headerDomAttrs(attrs));
        open.map = [params.startLine, params.endLine];
        open.markup = ':::';
        state.push(`${headerTokenName}_close`, 'div', -1).markup = ':::';
        return true;
    });

    // `block_directive` cannot interrupt a paragraph, a list or a blockquote.
    md.block.ruler.before(
        'fence',
        `${headerTokenName}_start`,
        (state, startLine, _endLine, silent) =>
            silent &&
            state.sCount[startLine] - state.blkIndent < 4 &&
            headerOpening.test(blockLine(state, startLine)),
        {alt: ['paragraph', 'reference', 'blockquote', 'list']},
    );
}
