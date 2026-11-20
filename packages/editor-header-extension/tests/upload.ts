import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {setHeaderImageAttrs} from '../src/wysiwyg/extensions/HeaderImage/commands';
import {uploadHeaderFile} from '../src/wysiwyg/plugins/HeaderUploadPlugin';

export const file = new File(['image'], 'a.png', {type: 'image/png'});

export function deferred() {
    let resolve!: (result: {url: string}) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<{url: string}>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return {handler: () => promise, resolve, reject};
}

export const settleUpload = {
    resolves: (upload: ReturnType<typeof deferred>, url = '/uploaded.png') => upload.resolve({url}),
    rejects: (upload: ReturnType<typeof deferred>) => upload.reject(new Error('Network')),
};

export async function settledResult<T>(promise: Promise<T>) {
    let result: {value: T} | undefined;
    promise.then(
        (value) => {
            result = {value};
        },
        () => {},
    );
    await new Promise((done) => setTimeout(done, 0));
    return result;
}

export const uploadImage = (
    view: EditorView,
    pos: number,
    image: File,
    handler: FileUploadHandler,
) =>
    uploadHeaderFile(view, pos, image, handler, (current, src) =>
        setHeaderImageAttrs(current, {src}),
    );
