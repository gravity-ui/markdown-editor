import type {EditorView} from 'prosemirror-view';

import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderAttr} from '../HeaderSpecs';
import {headerAt, setHeaderAttrs} from '../commands';

export function pickImageFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', () => resolve(input.files?.[0] ?? null), {once: true});
        input.addEventListener('cancel', () => resolve(null), {once: true});
        input.click();
    });
}

export async function uploadHeaderImage(
    view: EditorView,
    pos: number,
    handler: FileUploadHandler,
): Promise<'done' | 'cancelled' | 'failed'> {
    const file = await pickImageFile();
    if (!file) return 'cancelled';

    let url: string;
    try {
        ({url} = await handler(file));
    } catch {
        return 'failed';
    }

    const node = headerAt(view.state.doc, pos);
    if (!url || !node) return 'failed';

    setHeaderAttrs(pos, {
        [HeaderAttr.Image]: url,
        [HeaderAttr.ImageName]: file.name,
        [HeaderAttr.ImageEnabled]: 'true',
    })(view.state, view.dispatch);

    return 'done';
}
