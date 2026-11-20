import type {Slice} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

// Mirror EditorView.pasteHTML after parsing for formats that already provide a Slice.
export function pastePreparedSlice(
    view: EditorView,
    event: ClipboardEvent,
    source: Slice,
): boolean {
    let slice = source;
    view.someProp('transformPasted', (transform) => {
        slice = transform(slice, view);
    });
    if (!view.someProp('handlePaste', (handler) => handler(view, event, slice))) {
        insertPasteSlice(view, slice);
    }
    return true;
}

export function insertPasteSlice(view: EditorView, slice: Slice): void {
    const single = !slice.openStart && !slice.openEnd && slice.content.childCount === 1;
    const tr = single
        ? view.state.tr.replaceSelectionWith(slice.content.child(0), false)
        : view.state.tr.replaceSelection(slice);
    view.dispatch(tr.scrollIntoView().setMeta('paste', true).setMeta('uiEvent', 'paste'));
}
