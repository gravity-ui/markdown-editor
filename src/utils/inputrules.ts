import {InputRule} from 'prosemirror-inputrules';
import {Fragment, type Mark, type MarkType, type Node} from 'prosemirror-model';
import {type EditorState, TextSelection} from 'prosemirror-state';

// TODO: remove explicit import from base and code extensions
import {pType} from 'src/extensions/base/specs';
import {codeType} from 'src/extensions/markdown/specs';
import {isFunction} from 'src/lodash';
import {isMarkActive} from 'src/utils/marks';

export function hasCodeMark(
    state: EditorState,
    _match: RegExpMatchArray,
    start: number,
    end: number,
): boolean {
    // TODO: remove explicit import from code extension
    const codeMarkType = codeType(state.schema);
    if (isMarkActive(state, codeMarkType)) return true;
    if (state.doc.rangeHasMark(start, end, codeMarkType)) return true;
    return false;
}

export function inDefaultTextblock(
    state: EditorState,
    _match: RegExpMatchArray,
    start: number,
    _end: number,
): boolean {
    return state.doc.resolve(start).parent.type === pType(state.schema);
}

export {textblockTypeInputRule, wrappingInputRule} from './rulebuilders';

function getMarksBetween(start: number, end: number, state: EditorState) {
    let marks: {start: number; end: number; mark: Mark}[] = [];

    state.doc.nodesBetween(start, end, (node, pos) => {
        marks = [
            ...marks,
            ...node.marks.map((mark) => ({
                start: pos,
                end: pos + node.nodeSize,
                mark,
            })),
        ];
    });

    return marks;
}

function escapeRegex(string: string) {
    // eslint-disable-next-line no-useless-escape
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// TODO: link has a custom input rule handler, think about generalizing
export function markInputRule(
    rule: RegExp | {open: string; close: string; ignoreBetween?: string},
    markType: MarkType,
    getAttrs?: (match: any) => Record<string, unknown>,
): InputRule {
    let regexp;
    if (rule instanceof RegExp) {
        regexp = rule;
    } else {
        const open = escapeRegex(rule.open);
        const close = escapeRegex(rule.close);
        const ignoreBetween = escapeRegex(rule.ignoreBetween || '');
        regexp = new RegExp(
            `(?:${open})` +
                (ignoreBetween ? `([^\\s${ignoreBetween}]+)` : `([\\S]+)`) +
                `(?:${close})\\s$`,
        );
    }
    return new InputRule(regexp, (state, match, start, end) => {
        // handle the rule only if is start of line or there is a space before "open" symbols
        if ((match as RegExpMatchArray).index! > 0) {
            const re = match as RegExpMatchArray;
            if (re.input![re.index! - 1] !== ' ') return null;
        }

        if (hasCodeMark(state, match, start, end)) return null;

        const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
        const {tr} = state;
        const m = match.length - 1;
        let markEnd = end;
        let markStart = start;

        if (match[m]) {
            const matchStart = start + match[0].indexOf(match[m - 1]);
            const matchEnd = matchStart + match[m - 1].length - 1;
            const textStart = matchStart + match[m - 1].lastIndexOf(match[m]);
            const textEnd = textStart + match[m].length;

            const marksBetween = getMarksBetween(start, end, state);
            const excludedMarks = marksBetween
                .filter((item) => item.mark.type.excludes(markType))
                .filter((item) => item.end > matchStart);

            if (excludedMarks.length) {
                return null;
            }

            if (textEnd < matchEnd) {
                tr.delete(textEnd, matchEnd);
            }
            if (textStart > matchStart) {
                tr.delete(matchStart, textStart);
            }
            markStart = matchStart;
            markEnd = markStart + match[m].length;
        }

        tr.addMark(markStart, markEnd, markType.create(attrs));
        tr.removeStoredMark(markType);
        return tr;
    });
}

type NodeInputRuleReplaceFragment = Node | Fragment | readonly Node[] | null | undefined;

export function nodeInputRule(
    regexp: RegExp,
    fragment: NodeInputRuleReplaceFragment | ((match: string) => NodeInputRuleReplaceFragment),
    selectionOffset = 0,
): InputRule {
    return new InputRule(regexp, (state, match, start, end) => {
        if (hasCodeMark(state, match, start, end)) return null;

        const [matchStr] = match;
        const {tr} = state;

        if (matchStr) {
            tr.replaceWith(
                start - 1,
                end,
                isFunction(fragment)
                    ? (fragment(matchStr) ?? Fragment.empty)
                    : (fragment ?? Fragment.empty),
            ).setSelection(new TextSelection(tr.doc.resolve(start + selectionOffset)));
        }

        return tr;
    });
}

export function inlineNodeInputRule(
    regexp: RegExp,
    fragment: (match: string) => NodeInputRuleReplaceFragment,
): InputRule {
    return new InputRule(regexp, (state, match, start, end) => {
        if (hasCodeMark(state, match, start, end)) return null;

        const [matchStr] = match;
        const {tr} = state;

        if (matchStr) {
            tr.replaceWith(start, end, fragment(matchStr) ?? Fragment.empty).setSelection(
                new TextSelection(tr.doc.resolve(end)),
            );
        }

        return tr;
    });
}
