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
                if (!tr.docChanged && !meta) return uploads;
                const next = new Map<symbol, number>();
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
    });

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
    const id = Symbol('header-upload');
    view.dispatch(view.state.tr.setMeta(uploadsKey, {id, pos} satisfies UploadMeta));
    try {
        const {url} = await handler(file);
        const image = safeImageUrl(url);
        if (!image) throw new Error(`Unsupported image address: ${url}`);
        const current = view.isDestroyed ? undefined : uploadsKey.getState(view.state)?.get(id);
        return (
            current !== undefined &&
            setHeaderBackground(current, {'bg-image': image})(view.state, view.dispatch)
        );
    } finally {
        if (!view.isDestroyed) {
            view.dispatch(view.state.tr.setMeta(uploadsKey, {id} satisfies UploadMeta));
        }
    }
}
