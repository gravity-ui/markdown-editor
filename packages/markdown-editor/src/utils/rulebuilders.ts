///
/// Copy of https://github.com/ProseMirror/prosemirror-inputrules/blob/1.4.0/src/rulebuilders.ts
/// Added a check for the presence of a code mark
///

import {InputRule} from 'prosemirror-inputrules';
import type {Attrs, Node, NodeType} from 'prosemirror-model';
import {canJoin, findWrapping} from 'prosemirror-transform';

import {hasCodeMark, inDefaultTextblock} from './inputrules';

/// Build an input rule for automatically wrapping a textblock when a
/// given string is typed. The `regexp` argument is
/// directly passed through to the `InputRule` constructor. You'll
/// probably want the regexp to start with `^`, so that the pattern can
/// only occur at the start of a textblock.
///
/// `nodeType` is the type of node to wrap in. If it needs attributes,
/// you can either pass them directly, or pass a function that will
/// compute them from the regular expression match.
///
/// By default, if there's a node with the same type above the newly
/// wrapped node, the rule will try to [join](#transform.Transform.join) those
/// two nodes. You can pass a join predicate, which takes a regular
/// expression match and the node before the wrapped node, and can
/// return a boolean to indicate whether a join should happen.
export function wrappingInputRule(
    regexp: RegExp,
    nodeType: NodeType,
    getAttrs: Attrs | null | ((matches: RegExpMatchArray) => Attrs | null) = null,
    joinPredicate?: (match: RegExpMatchArray, node: Node) => boolean,
) {
    return new InputRule(regexp, (state, match, start, end) => {
        if (hasCodeMark(state, match, start, end)) return null;
        if (!inDefaultTextblock(state, match, start, end)) return null;

        const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
        const tr = state.tr.delete(start, end);
        const $start = tr.doc.resolve(start),
            range = $start.blockRange(),
            wrapping = range && findWrapping(range, nodeType, attrs);
        if (!wrapping) return null;
        tr.wrap(range!, wrapping);
        const before = tr.doc.resolve(start - 1).nodeBefore;
        if (
            before &&
            before.type == nodeType &&
            canJoin(tr.doc, start - 1) &&
            (!joinPredicate || joinPredicate(match, before))
        )
            tr.join(start - 1);
        return tr;
    });
}

/// Build an input rule that changes the type of a textblock when the
/// matched text is typed into it. You'll usually want to start your
/// regexp with `^` to that it is only matched at the start of a
/// textblock. The optional `getAttrs` parameter can be used to compute
/// the new node's attributes, and works the same as in the
/// `wrappingInputRule` function.
export function textblockTypeInputRule(
    regexp: RegExp,
    nodeType: NodeType,
    getAttrs: Attrs | null | ((match: RegExpMatchArray) => Attrs | null) = null,
) {
    return new InputRule(regexp, (state, match, start, end) => {
        if (hasCodeMark(state, match, start, end)) return null;

        const $start = state.doc.resolve(start);
        const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
        if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), nodeType))
            return null;
        return state.tr.delete(start, end).setBlockType(start, start, nodeType, attrs);
    });
}
