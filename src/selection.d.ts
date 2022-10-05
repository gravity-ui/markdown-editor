import prosemirrorState from 'prosemirror-state';

declare module 'prosemirror-state' {
    class Selection extends prosemirrorState.Selection {
        selectionName?: string;
    }
}
