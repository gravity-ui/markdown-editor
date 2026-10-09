import term from '@diplodoc/transform/lib/plugins/term';
import {termDefinitions} from '@diplodoc/transform/lib/plugins/term/termDefinitions';
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';

export const footnoteTokenName = 'inline_footnote';
export const footnoteDefinitionTokenName = 'footnote_definition';

/** Adapt native Diplodoc terms to editor nodes without rendering their definitions. */
export default function footnote(md: MarkdownIt) {
    const options = {isLintRun: true};
    md.use(term, options);
    const definitionRule = termDefinitions(md, options as Parameters<typeof termDefinitions>[1]);
    md.block.ruler.at(
        'termDefinitions',
        (state, start, end, silent) => {
            const firstToken = state.tokens.length;
            if (!definitionRule(state, start, end, silent)) return false;
            if (silent) return true;
            const raw = state.src
                .slice(
                    state.bMarks[start] + state.tShift[start],
                    state.eMarks[Math.min(state.line - 1, state.lineMax - 1)],
                )
                .trimEnd();
            const match = /^\[\*((?:\\.|[^\]])+)\]:\s*([\s\S]*)$/.exec(raw);
            if (!match) return true;
            const attrs = {
                key: match[1].replace(/\\(.)/g, '$1'),
                content: match[2].trim(),
                raw,
                separation:
                    start > 0 && state.bMarks[start - 1] === state.eMarks[start - 1] ? 2 : 1,
            };
            const open = state.tokens.slice(firstToken).find((token) => token.type === 'dfn_open');
            if (open) {
                open.meta = attrs;
                open.map = [start, state.line];
            } else {
                // Duplicate definitions must survive editing even though Diplodoc uses the first.
                const token = state.push(footnoteDefinitionTokenName, '', 0);
                token.meta = attrs;
                token.map = [start, state.line];
            }
            return true;
        },
        {alt: ['paragraph', 'reference']},
    );

    md.core.ruler.after('termReplace', 'editor_footnotes', (state) => {
        const result: Token[] = [];
        for (let index = 0; index < state.tokens.length; index++) {
            const token = state.tokens[index];
            if (token.type === '__yfm_lint') continue;
            if (token.type === 'dfn_open') {
                const definition = new state.Token(footnoteDefinitionTokenName, '', 0);
                definition.meta = token.meta;
                definition.map = token.map;
                result.push(definition);
                let depth = 1;
                while (++index < state.tokens.length && depth) {
                    if (state.tokens[index].type === 'dfn_open') depth++;
                    if (state.tokens[index].type === 'dfn_close') depth--;
                }
                index--;
                continue;
            }
            if (token.type === 'inline' && token.children) {
                const children: Token[] = [];
                const sources = [
                    ...token.content.matchAll(/\[((?:\\.|[^[\]])+)\]\(\*([^\n)]+)\)/g),
                ];
                for (let child = 0; child < token.children.length; child++) {
                    const open = token.children[child];
                    if (open.type === '__yfm_lint') continue;
                    if (open.type !== 'term_open') {
                        children.push(open);
                        continue;
                    }
                    const key = open.attrGet('term-key')!.slice(1);
                    const label = token.children[++child].content;
                    child++;
                    const sourceIndex = sources.findIndex(
                        (source) =>
                            source[2] === key && source[1].replace(/\\(.)/g, '$1') === label,
                    );
                    const raw = sourceIndex < 0 ? null : sources.splice(sourceIndex, 1)[0][0];
                    const note = new state.Token(footnoteTokenName, '', 0);
                    note.meta = {key, label, raw};
                    children.push(note);
                }
                token.children = children;
            }
            result.push(token);
        }
        state.tokens = result;
    });
}

export function footnoteReference(label: string, key: string) {
    return `[${label.replace(/[\\[\]]/g, '\\$&')}](*${key})`;
}
