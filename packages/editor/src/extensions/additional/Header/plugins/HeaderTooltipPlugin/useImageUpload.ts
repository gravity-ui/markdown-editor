import {useCallback, useEffect, useRef, useState} from 'react';

import {useToaster} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

export type ImageUpload = {
    /** Открывает файловый диалог; `undefined`, если хост не дал загрузчик. */
    pick?: () => void;
    uploading: boolean;
};

/**
 * Файловый диалог и загрузка одной картинки. Промис не трогает документ после размонтирования
 * тулбара, а ошибка не остаётся незамеченной — молча исчезающий индикатор загрузки это главный
 * дефект существующей работы с картинками в редакторе.
 */
export function useImageUpload(
    handler: FileUploadHandler | undefined,
    onUploaded: (url: string) => void,
): ImageUpload {
    const [uploading, setUploading] = useState(false);
    const alive = useRef(true);
    const toaster = useToaster();

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);

    const pick = useCallback(() => {
        if (!handler) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return;

            setUploading(true);
            handler(file)
                .then(({url}) => {
                    if (alive.current) onUploaded(url);
                })
                .catch((error: unknown) => {
                    toaster.add({
                        name: 'header-image-upload-failed',
                        theme: 'danger',
                        title: i18n('image.failed'),
                        content: error instanceof Error ? error.message : undefined,
                    });
                })
                .finally(() => {
                    if (alive.current) setUploading(false);
                });
        });
        input.click();
    }, [handler, onUploaded, toaster]);

    return {pick: handler ? pick : undefined, uploading};
}
