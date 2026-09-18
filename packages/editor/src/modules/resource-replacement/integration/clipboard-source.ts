import type {ResourceReplacementSource} from '../types';

const clipboardSourceType = 'application/x-markdown-editor-source';

/** Listen after the editor's copy/cut/dragstart handlers populate the transfer data. */
export function registerClipboardSource(dom: HTMLElement, editorInstanceId: string): () => void {
    const writeSource = (data: DataTransfer | null) => {
        if (!editorInstanceId || !data) return;
        try {
            // Preserve the identity written by a nested editor.
            if (data.getData(clipboardSourceType)) return;
            data.setData(clipboardSourceType, JSON.stringify({version: 1, editorInstanceId}));
        } catch {
            // Source metadata is optional; copying and dragging must still work.
        }
    };
    const onCopy = (event: ClipboardEvent) => {
        if (event.defaultPrevented) writeSource(event.clipboardData);
    };
    const onDragStart = (event: DragEvent) => {
        // Unlike copy/cut, preventing dragstart cancels the native operation.
        if (!event.defaultPrevented) writeSource(event.dataTransfer);
    };
    dom.addEventListener('copy', onCopy);
    dom.addEventListener('cut', onCopy);
    dom.addEventListener('dragstart', onDragStart);
    return () => {
        dom.removeEventListener('copy', onCopy);
        dom.removeEventListener('cut', onCopy);
        dom.removeEventListener('dragstart', onDragStart);
    };
}

export function readClipboardSource(
    data: DataTransfer | null,
    editorInstanceId?: string,
): ResourceReplacementSource | undefined {
    if (!data || !editorInstanceId) return undefined;
    try {
        const source: unknown = JSON.parse(data.getData(clipboardSourceType));
        if (
            !source ||
            typeof source !== 'object' ||
            !('version' in source) ||
            source.version !== 1 ||
            !('editorInstanceId' in source) ||
            typeof source.editorInstanceId !== 'string' ||
            !source.editorInstanceId
        )
            return undefined;
        return {sameEditor: source.editorInstanceId === editorInstanceId};
    } catch {
        return undefined;
    }
}
