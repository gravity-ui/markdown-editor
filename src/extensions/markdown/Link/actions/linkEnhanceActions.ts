import {chainCommands, toggleMark} from 'prosemirror-commands';
import {Command, NodeSelection, TextSelection} from 'prosemirror-state';
import {isNodeSelection} from 'prosemirror-utils';

import {ActionSpec, ExtensionDeps} from '../../../../core';
import {isMarkActive} from '../../../../utils/marks';
import {ImageRendererState, imageRendererKey} from '../../../yfm/ImgSize/const';
import {LinkAttr, imageType, linkType, removeLink} from '../../index';
import {addLinkPlaceholder} from '../PlaceholderWidget/commands';

export const addEmptyLink: Command = (state, dispatch) => {
    const linkMarkType = linkType(state.schema);
    const {selection} = state;
    const {nodeAfter} = selection.$from;
    if (
        selection.empty ||
        (isNodeSelection(selection) && selection.node.type !== imageType(state.schema)) ||
        (!(nodeAfter?.isInline && nodeAfter?.isAtom) && !nodeAfter?.isText)
    )
        return false;
    const {$from, $to} = selection;
    // text selection inside one text node
    if ($from.parent !== $to.parent) return false;
    let tr = state.tr;
    toggleMark(linkMarkType, {
        [LinkAttr.Href]: '',
        [LinkAttr.IsPlaceholder]: true,
    })(state, (_tr) => {
        tr = _tr;
    });
    tr.scrollIntoView();
    if (selection instanceof NodeSelection) {
        tr.setSelection(NodeSelection.create(tr.doc, $to.pos - 1));

        if (selection.node.type === imageType(state.schema)) {
            const meta: ImageRendererState = {linkAdded: true};
            tr.setMeta(imageRendererKey, meta);
        }
    } else {
        const selectedText = state.doc.textBetween($from.pos, $to.pos);
        const countOfWhitespacesAtEnd = selectedText.length - selectedText.trimEnd().length;
        tr.setSelection(TextSelection.create(tr.doc, $to.pos - countOfWhitespacesAtEnd - 1));
    }
    dispatch?.(tr);
    return true;
};

export const addLinkCmd2 = (deps: ExtensionDeps): Command =>
    chainCommands(removeLink, addEmptyLink, addLinkPlaceholder(deps));

export const linkActionSpec2 = (deps: ExtensionDeps): ActionSpec => ({
    isActive: (state) => Boolean(isMarkActive(state, linkType(state.schema))),
    isEnable: addLinkCmd2(deps),
    run: addLinkCmd2(deps),
});
