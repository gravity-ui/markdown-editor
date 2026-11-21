import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import {type Command, Plugin, PluginKey} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {safeImageUrl} from '@gravity-ui/markdown-plugin-banner';

export type BannerUploadLimits = {
    /** MIME types of uploaded images. Default – any `image/*` */
    imageTypes?: readonly string[];
    /** Maximum size of an uploaded image in bytes. Default – no limit */
    maxImageSize?: number;
};

type Drop = () => void;
type Uploads = ReadonlyMap<Drop, number>;
type UploadMeta = {id?: Drop; pos?: number};

const uploadsKey = new PluginKey<Uploads>('banner-upload');

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

export function cancelBannerUploads(view: EditorView, pos: number) {
    if (view.isDestroyed) return;
    const uploads = uploadsKey.getState(view.state);
    if (!uploads?.size || !Array.from(uploads.values()).includes(pos)) return;
    view.dispatch(view.state.tr.setMeta(uploadsKey, {pos} satisfies UploadMeta));
}

export async function uploadBannerFile(
    view: EditorView,
    pos: number,
    file: File,
    handler: FileUploadHandler,
    setImage: (pos: number, image: string) => Command,
): Promise<boolean> {
    let id!: Drop;
    const dropped = new Promise<false>((resolve) => {
        id = () => resolve(false);
    });
    view.dispatch(view.state.tr.setMeta(uploadsKey, {id, pos} satisfies UploadMeta));
    const apply = async () => {
        const {url} = await handler(file);
        const image = safeImageUrl(url);
        if (!image) throw new Error(`Unsupported image address: ${url}`);
        const current = view.isDestroyed ? undefined : uploadsKey.getState(view.state)?.get(id);
        return current !== undefined && setImage(current, image)(view.state, view.dispatch);
    };
    try {
        return await Promise.race([apply(), dropped]);
    } finally {
        if (!view.isDestroyed && uploadsKey.getState(view.state)?.has(id)) {
            view.dispatch(view.state.tr.setMeta(uploadsKey, {id} satisfies UploadMeta));
        }
    }
}
