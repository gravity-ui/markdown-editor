import {useCallback} from 'react';

import {useToaster} from '@gravity-ui/uikit';

import type {EditorView} from '#pm/view';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {isHeaderImageUploading, uploadHeaderImage} from '../imageUpload';

function pickImageFile(): Promise<File | undefined> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.hidden = true;

        const finish = (file?: File) => {
            input.remove();
            resolve(file);
        };
        input.addEventListener('change', () => finish(input.files?.[0]), {once: true});
        input.addEventListener('cancel', () => finish(), {once: true});
        document.body.append(input);
        try {
            input.click();
        } catch (error) {
            input.remove();
            reject(error);
        }
    });
}

export function useImageUpload(view: EditorView, pos: number, handler?: FileUploadHandler) {
    const toaster = useToaster();
    const pick = useCallback(() => {
        if (!handler) return;

        uploadHeaderImage(view, pos, handler, pickImageFile).catch((error: unknown) => {
            if (view.isDestroyed) return;
            toaster.add({
                name: 'header-image-upload-failed',
                theme: 'danger',
                title: i18n('image.failed'),
                content: error instanceof Error ? error.message : undefined,
            });
        });
    }, [view, pos, handler, toaster]);

    return {pick: handler ? pick : undefined, uploading: isHeaderImageUploading(view.state, pos)};
}
