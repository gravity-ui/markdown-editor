import {type EditorState, Plugin, PluginKey, type Transaction} from '#pm/state';
import {ReplaceAroundStep} from '#pm/transform';
import type {EditorView} from '#pm/view';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderBackground, headerType} from '../HeaderSpecs';

type PendingUpload = {id: object; pos: number};
type UploadMeta = {add?: PendingUpload; remove?: object};

const uploadKey = new PluginKey<readonly PendingUpload[]>('header-image-upload');

function mapUpload(upload: PendingUpload, tr: Transaction): PendingUpload | null {
    let {pos} = upload;
    for (const step of tr.steps) {
        const mapping = step.getMap();
        const mapped = mapping.mapResult(pos, 1);
        if (mapped.deleted) {
            // Attribute changes replace the opening token while preserving the header content.
            if (!(step instanceof ReplaceAroundStep) || step.gapFrom !== pos + 1) return null;
            pos = mapping.map(pos + 1, 1) - 1;
        } else {
            pos = mapped.pos;
        }
    }
    return pos >= 0 &&
        pos < tr.doc.content.size &&
        tr.doc.nodeAt(pos)?.type === headerType(tr.doc.type.schema)
        ? {...upload, pos}
        : null;
}

export const headerImageUploadPlugin = () =>
    new Plugin<readonly PendingUpload[]>({
        key: uploadKey,
        state: {
            init: () => [],
            apply(tr, uploads) {
                const meta: UploadMeta | undefined = tr.getMeta(uploadKey);
                if (!tr.docChanged && !meta) return uploads;
                const mapped = uploads.flatMap((upload) => {
                    const next = mapUpload(upload, tr);
                    return next && next.id !== meta?.remove ? [next] : [];
                });
                if (meta?.add) mapped.push(meta.add);
                return mapped;
            },
        },
    });

export function isHeaderImageUploading(state: EditorState, pos: number): boolean {
    return Boolean(uploadKey.getState(state)?.some((upload) => upload.pos === pos));
}

export async function uploadHeaderImage(
    view: EditorView,
    pos: number,
    handler: FileUploadHandler,
    pickFile: () => Promise<File | undefined>,
): Promise<void> {
    if (
        view.isDestroyed ||
        !uploadKey.getState(view.state) ||
        pos < 0 ||
        pos >= view.state.doc.content.size ||
        view.state.doc.nodeAt(pos)?.type !== headerType(view.state.schema) ||
        isHeaderImageUploading(view.state, pos)
    ) {
        return;
    }

    const id = {};
    const pending = () =>
        !view.isDestroyed && uploadKey.getState(view.state)?.find((upload) => upload.id === id);
    view.dispatch(view.state.tr.setMeta(uploadKey, {add: {id, pos}} satisfies UploadMeta));

    try {
        const file = await pickFile();
        if (!file || !pending()) return;

        const {url} = await handler(file);
        const target = pending();
        if (!target) return;

        const node = view.state.doc.nodeAt(target.pos)!;
        view.dispatch(
            view.state.tr
                .setNodeMarkup(target.pos, null, {
                    ...node.attrs,
                    bg: HeaderBackground.Image,
                    image: url,
                })
                .setMeta(uploadKey, {remove: id} satisfies UploadMeta),
        );
    } finally {
        if (pending()) {
            view.dispatch(view.state.tr.setMeta(uploadKey, {remove: id} satisfies UploadMeta));
        }
    }
}
