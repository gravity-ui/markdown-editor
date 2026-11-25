import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    Plugin,
    PluginKey,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

type Drop = () => void;
type Upload = {pos: number; attrs: readonly string[]};
type Uploads = ReadonlyMap<Drop, Upload>;
type UploadMeta = {id?: Drop; pos?: number; attrs?: readonly string[]};

const uploadsKey = new PluginKey<Uploads>('node-upload');

const attrsChanged = (attrs: readonly string[], before: Node | null, after: Node | null) =>
    attrs.some((name) => before?.attrs[name] !== after?.attrs[name]);

// An upload is dropped when its node is removed, when one of its watched attributes changes,
// when it is cancelled and when a new upload starts for the same node.
export const nodeUploadPlugin = () =>
    new Plugin<Uploads>({
        key: uploadsKey,
        state: {
            init: () => new Map(),
            apply: (tr, uploads) => {
                const meta: UploadMeta | undefined = tr.getMeta(uploadsKey);
                if (!meta && (!tr.docChanged || !uploads.size)) return uploads;
                const next = new Map<Drop, Upload>();
                for (const [id, {pos, attrs}] of uploads) {
                    const mapped = tr.mapping.mapResult(pos, 1);
                    if (mapped.deleted || id === meta?.id || mapped.pos === meta?.pos) continue;
                    if (attrsChanged(attrs, tr.before.nodeAt(pos), tr.doc.nodeAt(mapped.pos))) {
                        continue;
                    }
                    next.set(id, {pos: mapped.pos, attrs});
                }
                if (meta?.id && meta.pos !== undefined) {
                    next.set(meta.id, {pos: meta.pos, attrs: meta.attrs ?? []});
                }
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
                destroy: () => active?.forEach((_upload, drop) => drop()),
            };
        },
    });

export const dropNodeUploads = (tr: Transaction, pos: number) =>
    tr.setMeta(uploadsKey, {pos} satisfies UploadMeta);

export function hasNodeUploads(state: EditorState, pos: number) {
    const uploads = uploadsKey.getState(state);
    return (
        uploads !== undefined && Array.from(uploads.values()).some((upload) => upload.pos === pos)
    );
}

export type NodeUploadOptions = {
    /** Node attributes whose change by any transaction, such as an undo, drops the upload. */
    attrs?: readonly string[];
    /** Drops this upload, wherever its node has moved. */
    signal?: AbortSignal;
};

// Resolves to `false` when the upload is dropped before it ends.
export async function uploadNodeFile(
    view: EditorView,
    pos: number,
    file: File,
    upload: (file: File) => Promise<string>,
    setResult: (pos: number, url: string) => Command,
    {attrs, signal}: NodeUploadOptions = {},
): Promise<boolean> {
    if (signal?.aborted) return false;
    let applying = false;
    let id!: Drop;
    const dropped = new Promise<false>((resolve) => {
        id = () => {
            if (!applying) resolve(false);
        };
    });
    const release = () => {
        if (!view.isDestroyed && uploadsKey.getState(view.state)?.has(id)) {
            view.dispatch(view.state.tr.setMeta(uploadsKey, {id} satisfies UploadMeta));
        }
    };
    view.dispatch(view.state.tr.setMeta(uploadsKey, {id, pos, attrs} satisfies UploadMeta));
    signal?.addEventListener('abort', release);
    const apply = async () => {
        const url = await upload(file);
        const current = view.isDestroyed ? undefined : uploadsKey.getState(view.state)?.get(id);
        if (current === undefined) return false;
        applying = true;
        return setResult(current.pos, url)(view.state, view.dispatch);
    };
    try {
        return await Promise.race([apply(), dropped]);
    } finally {
        signal?.removeEventListener('abort', release);
        release();
    }
}
