import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import {
    type Command,
    type EditorState,
    Plugin,
    PluginKey,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {safeImageUrl} from '@gravity-ui/markdown-plugin-banner';

type Drop = () => void;
type Uploads = ReadonlyMap<Drop, number>;
type UploadMeta = {id?: Drop; pos?: number};

const uploadsKey = new PluginKey<Uploads>('banner-upload');

/**
 * Tracks the position of the node of each upload through the transactions.
 * An upload is dropped when its node is removed, when it is cancelled, and when a new upload starts for the same node.
 */
export const bannerUploadPlugin = () =>
    new Plugin<Uploads>({
        key: uploadsKey,
        state: {
            init: () => new Map(),
            apply: (tr, uploads) => {
                const meta: UploadMeta | undefined = tr.getMeta(uploadsKey);
                if (!meta && (!tr.docChanged || !uploads.size)) return uploads;
                const next = new Map<Drop, number>();
                for (const [id, pos] of uploads) {
                    const mapped = tr.mapping.mapResult(pos, 1);
                    if (!mapped.deleted && id !== meta?.id && mapped.pos !== meta?.pos) {
                        next.set(id, mapped.pos);
                    }
                }
                if (meta?.id && meta.pos !== undefined) next.set(meta.id, meta.pos);
                return next;
            },
        },
        view: (editor) => {
            let active = uploadsKey.getState(editor.state);
            return {
                update: (view) => {
                    const previous = active;
                    active = uploadsKey.getState(view.state);
                    if (!previous || previous === active) return;
                    for (const drop of previous.keys()) {
                        if (!active?.has(drop)) drop();
                    }
                },
                destroy: () => active?.forEach((_pos, drop) => drop()),
            };
        },
    });

/** Drops the uploads into the node at `pos` with the transaction that sets a new source of the node. */
export const dropBannerUploads = (tr: Transaction, pos: number) =>
    tr.setMeta(uploadsKey, {pos} satisfies UploadMeta);

export function hasBannerUploads(state: EditorState, pos: number) {
    const uploads = uploadsKey.getState(state);
    return uploads !== undefined && Array.from(uploads.values()).includes(pos);
}

/** Drops the uploads into the node at `pos`: their results are not written. */
export function cancelBannerUploads(view: EditorView, pos: number) {
    if (view.isDestroyed || !hasBannerUploads(view.state, pos)) return;
    view.dispatch(dropBannerUploads(view.state.tr, pos));
}

/**
 * Uploads `file` for the node at `pos` and writes the address with `setImage` at the current position of the node.
 * Resolves to `false` when the upload is dropped before it ends; rejects when the upload fails.
 */
export async function uploadBannerFile(
    view: EditorView,
    pos: number,
    file: File,
    handler: FileUploadHandler,
    setImage: (pos: number, image: string) => Command,
): Promise<boolean> {
    let applying = false;
    let id!: Drop;
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
        applying = true;
        return setImage(current, image)(view.state, view.dispatch);
    };
    try {
        return await Promise.race([apply(), dropped]);
    } finally {
        if (!view.isDestroyed && uploadsKey.getState(view.state)?.has(id)) {
            view.dispatch(view.state.tr.setMeta(uploadsKey, {id} satisfies UploadMeta));
        }
    }
}
