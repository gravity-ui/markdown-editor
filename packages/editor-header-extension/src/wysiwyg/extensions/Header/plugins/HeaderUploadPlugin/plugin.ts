import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {safeImageUrl} from '@gravity-ui/markdown-plugin-header';

import {setHeaderBackground} from '../../commands';

import {type UploadMeta, type Uploads, uploadsKey} from './const';

export type HeaderImageLimits = {
    /** MIME types of background images; any `image/*` without it. */
    imageTypes?: readonly string[];
    /** Maximum background image size in bytes; the size is not checked without it. */
    maxImageSize?: number;
};

/** Tracks the banner position of each upload; a new upload into the same banner replaces the old one. */
export const headerUploadPlugin = () =>
    new Plugin<Uploads>({
        key: uploadsKey,
        state: {
            init: () => new Map(),
            apply: (tr, uploads) => {
                const meta: UploadMeta | undefined = tr.getMeta(uploadsKey);
                if (!meta && (!tr.docChanged || !uploads.size)) return uploads;
                const next = new Map<() => void, number>();
                for (const [id, pos] of uploads) {
                    const mapped = tr.mapping.mapResult(pos, 1);
                    if (!mapped.deleted && id !== meta?.id && mapped.pos !== meta?.pos) {
                        next.set(id, mapped.pos);
                    }
                }
                if (meta?.id !== undefined && meta.pos !== undefined) next.set(meta.id, meta.pos);
                return next;
            },
        },
        view: () => ({
            update: (view, prevState) => {
                const prev = uploadsKey.getState(prevState);
                const next = uploadsKey.getState(view.state);
                if (!prev?.size || prev === next) return;
                for (const drop of prev.keys()) {
                    if (!next?.has(drop)) drop();
                }
            },
        }),
    });

export function cancelHeaderUploads(view: EditorView, pos: number) {
    if (view.isDestroyed) return;
    const uploads = uploadsKey.getState(view.state);
    if (!uploads?.size || !Array.from(uploads.values()).includes(pos)) return;
    view.dispatch(view.state.tr.setMeta(uploadsKey, {pos} satisfies UploadMeta));
}

export function imageFileError(
    file: File,
    {imageTypes, maxImageSize}: HeaderImageLimits,
): 'type' | 'size' | null {
    if (imageTypes ? !imageTypes.includes(file.type) : !file.type.startsWith('image/')) {
        return 'type';
    }
    if (maxImageSize !== undefined && file.size > maxImageSize) return 'size';
    return null;
}

/**
 * Writes the uploaded address into `bg-image` of the banner at `pos`.
 * Resolves to `false` if the banner is removed or its background source is changed or reset.
 */
export async function uploadHeaderImage(
    view: EditorView,
    pos: number,
    file: File,
    handler: FileUploadHandler,
): Promise<boolean> {
    let applying = false;
    let id!: () => void;
    const dropped = new Promise<false>((resolve) => {
        id = () => {
            if (!applying) resolve(false);
        };
    });
    view.dispatch(view.state.tr.setMeta(uploadsKey, {id, pos} satisfies UploadMeta));
    const apply = async () => {
        const {url} = await handler(file);
        const image = safeImageUrl(url);
        if (!image) throw new Error(`Unsupported image address: ${url}`);
        const current = view.isDestroyed ? undefined : uploadsKey.getState(view.state)?.get(id);
        if (current === undefined) return false;
        // Applying the source also removes its upload entry.
        applying = true;
        return setHeaderBackground(current, {'bg-image': image})(view.state, view.dispatch);
    };
    try {
        return await Promise.race([apply(), dropped]);
    } finally {
        if (!view.isDestroyed && uploadsKey.getState(view.state)?.has(id)) {
            view.dispatch(view.state.tr.setMeta(uploadsKey, {id} satisfies UploadMeta));
        }
    }
}
