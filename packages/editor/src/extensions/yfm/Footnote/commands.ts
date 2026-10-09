import {type Command, NodeSelection, TextSelection} from 'prosemirror-state';

import type {ExtensionDeps} from '#core';

import {footnoteType} from './FootnoteSpecs';

export function insertFootnote({serializer}: ExtensionDeps): Command {
    return (state, dispatch) => {
        const {selection, schema} = state;
        if (!(selection instanceof TextSelection) || !selection.$from.sameParent(selection.$to))
            return false;
        if (!selection.$from.parent.inlineContent) return false;
        if (selection.$from.parent.type.spec.code) return false;
        const type = footnoteType(schema);
        const index = selection.$from.index();
        if (!selection.$from.parent.canReplaceWith(index, selection.$to.index(), type))
            return false;
        if (!dispatch) return true;

        const content = selection.empty
            ? ''
            : serializer.serialize(
                  schema.topNodeType.create(
                      null,
                      schema.nodes.paragraph.create(
                          null,
                          selection.$from.parent.content.cut(
                              selection.$from.parentOffset,
                              selection.$to.parentOffset,
                          ),
                      ),
                  ),
              );
        const tr = state.tr.replaceSelectionWith(type.create({content}), false);
        tr.setSelection(NodeSelection.create(tr.doc, selection.from));
        dispatch(tr.scrollIntoView());
        return true;
    };
}

export function updateFootnote(
    pos: number,
    content: string,
    {markupParser}: ExtensionDeps,
): Command {
    return (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== footnoteType(state.schema)) return false;
        const parsed = markupParser.parse(node.attrs.prefix + content + node.attrs.suffix);
        const paragraph = parsed.firstChild;
        const note = paragraph?.firstChild;
        if (
            parsed.childCount !== 1 ||
            paragraph?.childCount !== 1 ||
            note?.type !== node.type ||
            note.attrs.content !== content
        )
            return false;
        dispatch?.(state.tr.setNodeMarkup(pos, undefined, note.attrs, node.marks));
        return true;
    };
}
