import {Plugin, PluginKey} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {FileUploadHandler} from 'src/utils/upload';

import {safeImageUrl} from '../HeaderSpecs/dom';
import {headerAt, mapHeaderPos, setHeaderAttrs, setHeaderMedia} from '../commands';

type UploadTarget = 'background' | 'media';
type PendingUpload = {pos: number; target: UploadTarget};
const uploadKey = new PluginKey<ReadonlyMap<symbol, PendingUpload>>('header-image-upload');
export const headerImageUploadPlugin = () =>
    new Plugin({
        key: uploadKey,
        state: {
            init: () => new Map<symbol, PendingUpload>(),
            apply: (tr, previous) => {
                const next = new Map<symbol, PendingUpload>();
                for (const [id, upload] of previous) {
                    const pos = mapHeaderPos(tr, upload.pos);
                    if (pos !== null) next.set(id, {...upload, pos});
                }
                const meta = tr.getMeta(uploadKey) as
                    | {id: symbol; pos?: number; target?: UploadTarget}
                    | undefined;
                if (meta) {
                    if (meta.pos === undefined) next.delete(meta.id);
                    else {
                        for (const [id, upload] of next)
                            if (upload.pos === meta.pos && upload.target === meta.target)
                                next.delete(id);
                        next.set(meta.id, {pos: meta.pos, target: meta.target ?? 'background'});
                    }
                }
                return next;
            },
        },
    });

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
    target: UploadTarget = 'background',
): Promise<'done' | 'cancelled' | 'failed'> {
    const id = Symbol('upload');
    view.dispatch(view.state.tr.setMeta(uploadKey, {id, pos, target}));
    try {
        const file = await pickImageFile();
        if (!file) return 'cancelled';
        if (file.size > 2 * 1024 * 1024 || (file.type && !file.type.startsWith('image/')))
            return 'failed';
        const result = await handler(file);
        if (view.isDestroyed) return 'cancelled';
        const currentPos = uploadKey.getState(view.state)?.get(id)?.pos;
        if (
            currentPos === undefined ||
            !headerAt(view.state.doc, currentPos) ||
            !safeImageUrl(result.url)
        )
            return 'failed';
        if (target === 'background')
            setHeaderAttrs(currentPos, {
                image: result.url,
                'image-name': result.name ?? file.name,
                'image-enabled': 'true',
            })(view.state, view.dispatch);
        else
            setHeaderMedia(currentPos, {
                src: result.url,
                name: result.name ?? file.name,
                enabled: 'true',
            })(view.state, view.dispatch);
        return 'done';
    } catch {
        return 'failed';
    } finally {
        if (!view.isDestroyed) view.dispatch(view.state.tr.setMeta(uploadKey, {id}));
    }
}
