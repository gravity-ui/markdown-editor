import MarkdownIt, {type PluginSimple} from 'markdown-it';

import {
    type HeaderDimensions,
    headerDefaults,
    headerDomAttrs,
    headerSourceTokenName,
    headerTokenName,
    isHeaderHeight,
    isHeaderWidth,
} from './dimensions';

export * from './dimensions';

function parseDimensions(line: string): HeaderDimensions | undefined {
    const opening = /^:::header(?:\{([^{}]*)\})?[ \t]*$/.exec(line);
    if (!opening) return undefined;
    const dimensions = {...headerDefaults};
    const seen = new Set<string>();
    let attrs = opening[1]?.trim() ?? '';
    while (attrs) {
        const match = /^(height|width)=(?:"([^"\s]*)"|'([^'\s]*)'|([a-z]+))(?:\s+|$)/.exec(attrs);
        if (!match || seen.has(match[1])) return undefined;
        const [, name, doubleQuoted, singleQuoted, unquoted] = match;
        const value = doubleQuoted ?? singleQuoted ?? unquoted;
        if (name === 'height' && isHeaderHeight(value)) dimensions.height = value;
        else if (name === 'width' && isHeaderWidth(value)) dimensions.width = value;
        else return undefined;
        seen.add(name);
        attrs = attrs.slice(match[0].length);
    }
    return dimensions;
}

/** Detects the closing line of a container and ignores delimiters inside code fences. */
function trackDelimiters() {
    let nesting = 1;
    let fence = '';
    return (line: string) => {
        const marker = /^(`{3,}|~{3,})/.exec(line)?.[1];
        if (fence) {
            if (marker?.startsWith(fence) && !line.slice(marker.length).trim()) fence = '';
        } else if (marker) fence = marker;
        else if (/^:::[ \t]*$/.test(line)) nesting--;
        else if (/^:::[a-zA-Z]/.test(line)) nesting++;
        return nesting === 0;
    };
}

export const headerPlugin: PluginSimple = (md) => {
    md.block.ruler.before(
        'fence',
        headerTokenName,
        (state, startLine, endLine, silent) => {
            if (state.sCount[startLine] - state.blkIndent >= 4) return false;
            const line = (index: number) =>
                state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]);
            const opening = line(startLine);
            if (!/^:::header(?=$|[\s{[])/.test(opening)) return false;
            if (silent) return true;

            const closes = trackDelimiters();
            let nextLine = startLine + 1;
            let closed = false;
            let empty = true;
            for (; nextLine < endLine; nextLine++) {
                if (state.sCount[nextLine] < state.blkIndent && !state.isEmpty(nextLine)) break;
                const current = line(nextLine);
                closed = closes(current);
                if (closed) break;
                if (current.trim()) empty = false;
            }
            const after = closed ? nextLine + 1 : nextLine;
            const dimensions = parseDimensions(opening);
            const supported = closed && empty && dimensions;
            const token = state.push(supported ? headerTokenName : headerSourceTokenName, 'div', 0);
            token.block = true;
            token.map = [startLine, after];
            if (supported) token.attrs = Object.entries(headerDomAttrs(dimensions));
            else token.content = state.getLines(startLine, after, state.blkIndent, false);
            state.line = after;
            return true;
        },
        {alt: ['paragraph', 'reference', 'blockquote', 'list']},
    );

    md.renderer.rules[headerTokenName] = (tokens, index, _options, _env, renderer) =>
        `<div${renderer.renderAttrs(tokens[index])}></div>\n`;
    md.renderer.rules[headerSourceTokenName] = (tokens, index) =>
        `<pre><code>${md.utils.escapeHtml(tokens[index].content)}</code></pre>\n`;
};

let sourceParser: MarkdownIt | undefined;

/** Checks that the text is a single Header container that the plugin keeps as source. */
export function isHeaderSource(source: string) {
    sourceParser ??= new MarkdownIt('zero').use(headerPlugin);
    const tokens = sourceParser.parse(source, {});
    return (
        tokens.length === 1 &&
        tokens[0].type === headerSourceTokenName &&
        tokens[0].content === source
    );
}

export default headerPlugin;
