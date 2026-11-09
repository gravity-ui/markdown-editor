/* eslint-disable no-param-reassign -- Markdown-it block rules update their parsing state. */
import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import MarkdownIt, {type PluginSimple} from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';

import {headerClassNames} from './classname';
import {headerTokenName} from './const';
import {headerDimensions} from './dimensions';

const getLine = (state: StateBlock, line: number) =>
    state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);

// A table checks body lines for terminators after it pushes its opening tokens.
const blockLevel = (state: StateBlock) => {
    if (state.parentType === 'table') {
        for (let i = state.tokens.length - 1; i >= 0; i--) {
            if (state.tokens[i].type === 'table_open') return state.tokens[i].level;
        }
    }
    return state.level;
};

export const headerPlugin: PluginSimple = (md) => {
    // The directive parser scans closing markers without accounting for code blocks.
    // Use it for opening syntax only; parse children with the main block parser.
    const openingParser = new MarkdownIt().use(directiveParser());
    registerContainerDirective(openingParser, {
        name: 'header',
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: headerTokenName,
            attrs: ({attrs}) => ({class: headerClassNames(attrs ?? {})}),
            meta: ({attrs}) => headerDimensions(attrs ?? {}),
        },
    });

    const containers = new WeakMap<
        StateBlock,
        {level: number; blkIndent: number; endLine: number; closeLine: number}
    >();
    const unclosed = new WeakMap<StateBlock, Set<string>>();

    md.block.ruler.before(
        'fence',
        'header_close',
        (state, startLine, _endLine, silent) => {
            const container = containers.get(state);
            if (!container || state.sCount[startLine] - container.blkIndent >= 4) return false;
            if (!/^:{3,}\s*$/.test(getLine(state, startLine))) return false;
            // Inside a nested block, only a line dedented out of it belongs to the container.
            if (
                blockLevel(state) !== container.level &&
                state.sCount[startLine] >= state.blkIndent
            )
                return false;
            if (!silent) {
                container.closeLine = startLine;
                state.line = container.endLine;
            }
            return true;
        },
        {alt: ['paragraph', 'reference', 'blockquote', 'list']},
    );

    md.block.ruler.before('fence', 'header', (state, startLine, endLine, silent) => {
        if (state.sCount[startLine] - state.blkIndent >= 4) return false;
        const line = getLine(state, startLine);
        if (!/^:{3,}\s*header(?=[{\s]|$)/i.test(line)) return false;
        // An outer rollback re-parses these lines; the same attempt fails again.
        const attempt = `${startLine}:${endLine}:${state.blkIndent}`;
        if (unclosed.get(state)?.has(attempt)) return false;
        const opening = openingParser.parse(line + '\n:::', {})[0];
        if (opening?.type !== `${headerTokenName}_open`) return false;
        if (silent) return true;

        const parent = containers.get(state);
        const oldParentType = state.parentType;
        const oldLineMax = state.lineMax;
        const oldLevel = state.level;
        const oldTokenCount = state.tokens.length;
        const token = state.push(`${headerTokenName}_open`, 'div', 1);
        token.block = true;
        token.attrs = opening.attrs;
        token.meta = opening.meta;
        token.markup = opening.markup;
        const container = {level: state.level, blkIndent: state.blkIndent, endLine, closeLine: -1};
        containers.set(state, container);
        state.parentType = 'header' as StateBlock['parentType'];
        state.lineMax = endLine;
        state.md.block.tokenize(state, startLine + 1, endLine);
        state.parentType = oldParentType;
        state.lineMax = oldLineMax;
        if (parent) containers.set(state, parent);
        else containers.delete(state);

        if (container.closeLine < 0) {
            state.tokens.length = oldTokenCount;
            state.level = oldLevel;
            state.line = startLine;
            unclosed.set(state, (unclosed.get(state) ?? new Set<string>()).add(attempt));
            return false;
        }
        token.map = [startLine, container.closeLine + 1];
        const close = state.push(`${headerTokenName}_close`, 'div', -1);
        close.block = true;
        close.markup = ':::';
        state.line = container.closeLine + 1;
        return true;
    });
};
