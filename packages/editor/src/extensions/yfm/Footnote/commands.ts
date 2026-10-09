import {Fragment} from 'prosemirror-model';
import {type Command, NodeSelection, TextSelection} from 'prosemirror-state';

import type {ExtensionDeps} from '#core';
import {footnoteReference} from 'src/markdown-it/footnote';

import {footnoteDefinitionType, footnoteType} from './FootnoteSpecs';
import {footnoteDefinitions} from './definitions';

export function insertFootnote(): Command {
    return (state, dispatch) => {
        const {selection, schema} = state;
        if (!(selection instanceof TextSelection) || !selection.$from.sameParent(selection.$to))
            return false;
        if (!selection.$from.parent.inlineContent || selection.$from.parent.type.spec.code)
            return false;
        const selected = selection.$from.parent.content.cut(
            selection.$from.parentOffset,
            selection.$to.parentOffset,
        );
        // Native term labels are plain text; uniformly formatted selections retain their outer marks.
        const marks = selected.firstChild?.marks ?? [];
        let compatible = true;
        selected.forEach((node) => {
            if (
                !node.isText ||
                !node.hasMarkup(node.type, node.attrs, marks) ||
                node.marks.some((mark) => mark.type.spec.code || mark.type.name === 'link')
            )
                compatible = false;
        });
        if (!compatible) return false;
        const type = footnoteType(schema);
        if (
            !selection.$from.parent.canReplaceWith(
                selection.$from.index(),
                selection.$to.index(),
                type,
                marks,
            )
        )
            return false;
        if (!dispatch) return true;
        const used = footnoteDefinitions(state.doc);
        state.doc.descendants((node) => {
            if (node.type === type) used.set(node.attrs.key, {node, pos: 0});
        });
        let number = 1;
        while (used.has(`footnote-${number}`)) number++;
        const label = selection.empty ? '*' : state.doc.textBetween(selection.from, selection.to);
        const tr = state.tr.replaceSelectionWith(
            type.create(
                {key: `footnote-${number}`, label, original: selected.toJSON() ?? []},
                null,
                marks,
            ),
            false,
        );
        tr.setSelection(NodeSelection.create(tr.doc, selection.from));
        dispatch(tr.scrollIntoView());
        return true;
    };
}

export function updateFootnote(
    pos: number,
    label: string,
    content: string,
    {markupParser}: ExtensionDeps,
): Command {
    return (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== footnoteType(state.schema) || !label.trim() || !content.trim())
            return false;
        content = content.trim();
        const raw = footnoteReference(label, node.attrs.key);
        const parsed = markupParser.parse(`${raw}\n\n[*${node.attrs.key}]: ${content}`);
        const reference = parsed.firstChild?.firstChild;
        const definition = footnoteDefinitions(parsed).get(node.attrs.key)?.node;
        if (
            parsed.childCount !== 2 ||
            parsed.firstChild?.childCount !== 1 ||
            reference?.type !== node.type ||
            reference.attrs.label !== label ||
            definition?.attrs.content !== content
        )
            return false;
        if (!dispatch) return true;
        const tr = state.tr.setNodeMarkup(
            pos,
            undefined,
            {...node.attrs, label, raw, original: null},
            node.marks,
        );
        const existing = footnoteDefinitions(state.doc).get(node.attrs.key);
        if (existing) {
            tr.setNodeMarkup(existing.pos, undefined, {
                ...existing.node.attrs,
                content,
                raw:
                    existing.node.attrs.content === content
                        ? existing.node.attrs.raw
                        : `[*${node.attrs.key}]: ${content}`,
            });
        } else {
            tr.insert(
                tr.doc.content.size,
                footnoteDefinitionType(state.schema).create({
                    key: node.attrs.key,
                    content,
                    raw: `[*${node.attrs.key}]: ${content}`,
                }),
            );
        }
        dispatch(tr.scrollIntoView());
        return true;
    };
}

export function cancelFootnote(pos: number): Command {
    return (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== footnoteType(state.schema) || node.attrs.original === null) return false;
        dispatch?.(
            state.tr.replaceWith(
                pos,
                pos + node.nodeSize,
                Fragment.fromJSON(state.schema, node.attrs.original),
            ),
        );
        return true;
    };
}
