import MarkdownIt from 'markdown-it';

import {blockLine, headerDirective, headerOpening} from './directive';
import {headerText} from './text';

export const headerSourceTokenName = 'header_source';

function trackDelimiters() {
    let nesting = 1;
    let fence = '';
    return (line: string) => {
        // A backtick fence has no backticks after its marker, as in markdown-it.
        const marker = /^(`{3,}(?=[^`]*$)|~{3,})/.exec(line)?.[1];
        if (fence) {
            if (marker?.startsWith(fence) && !line.slice(marker.length).trim()) fence = '';
        } else if (marker) fence = marker;
        else if (/^:::[ \t]*$/.test(line)) nesting--;
        else if (/^:::[a-zA-Z]/.test(line)) nesting++;
        return nesting === 0;
    };
}

/** Keeps a `header` container that the directive rejected as source text. */
export function headerSource(md: MarkdownIt) {
    md.block.ruler.after('block_directive', headerSourceTokenName, (state, startLine, endLine) => {
        if (state.sCount[startLine] - state.blkIndent >= 4) return false;
        if (!headerOpening.test(blockLine(state, startLine))) return false;

        const closes = trackDelimiters();
        let nextLine = startLine + 1;
        let closed = false;
        for (; nextLine < endLine; nextLine++) {
            if (state.sCount[nextLine] < state.blkIndent && !state.isEmpty(nextLine)) break;
            const indentedCode = state.sCount[nextLine] - state.blkIndent >= 4;
            closed = !indentedCode && closes(blockLine(state, nextLine));
            if (closed) break;
        }
        const after = closed ? nextLine + 1 : nextLine;
        const token = state.push(headerSourceTokenName, 'div', 0);
        token.map = [startLine, after];
        token.content = state.getLines(startLine, after, state.blkIndent, false);
        state.line = after;
        return true;
    });

    md.renderer.rules[headerSourceTokenName] = (tokens, index) =>
        `<pre><code>${md.utils.escapeHtml(tokens[index].content)}</code></pre>\n`;
}

let sourceParser: MarkdownIt | undefined;

/** The text is exactly one Header container that the plugin keeps as source. */
export function isHeaderSource(source: string) {
    sourceParser ??= new MarkdownIt('zero').use(headerDirective).use(headerText).use(headerSource);
    const tokens = sourceParser.parse(source, {});
    return (
        tokens.length === 1 &&
        tokens[0].type === headerSourceTokenName &&
        tokens[0].content === source
    );
}
