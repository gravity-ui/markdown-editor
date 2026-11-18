import {type ReactNode, type Ref, useCallback, useEffect, useRef, useState} from 'react';

import {ArrowsRotateRight} from '@gravity-ui/icons';
import {ImageForm, type ImageFormSubmitParams} from '@gravity-ui/markdown-editor';
import {safeImageUrl} from '@gravity-ui/markdown-plugin-header';
import {Button, Icon, Text, useForkRef} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import type {HeaderUploadLimits} from '../../plugins/HeaderUploadPlugin';
import {focusableSelector} from '../popup';

import {SettingsRow} from './SettingsRow';
import {cnHeaderSettings} from './classname';
import {imageFileError, imageName, uploadHint} from './image';

import './SettingsDialog.scss';

type ImageSourceProps = {
    image: string | null;
    limits: HeaderUploadLimits;
    firstFieldRef?: Ref<HTMLElement>;
    upload?: (file: File) => Promise<boolean>;
    cancelUpload?: () => void;
    onLink: (address: string) => void;
    onClose: () => void;
    children: (file: ReactNode) => ReactNode;
};

export function ImageSource({
    image,
    limits,
    firstFieldRef,
    upload,
    cancelUpload,
    onLink,
    onClose,
    children,
}: ImageSourceProps) {
    const [replacing, setReplacing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const restoreFocus = useRef(false);
    const uploading = useRef(false);
    const failed = useRef(false);
    const form = useRef<HTMLDivElement | null>(null);
    const setFirstField = useForkRef(firstFieldRef);
    const cancel = useRef(cancelUpload);
    cancel.current = cancelUpload;
    useEffect(
        () => () => {
            if (uploading.current) cancel.current?.();
        },
        [],
    );
    useEffect(() => {
        if (loading || !failed.current) return;
        failed.current = false;
        const focused = document.activeElement;
        if (focused && focused !== document.body) return;
        form.current?.querySelector<HTMLElement>('input[type="file"] + button')?.focus();
    }, [loading]);
    const replaceRef = useCallback(
        (element: HTMLButtonElement | null) => {
            setFirstField?.(element);
            if (element && restoreFocus.current) {
                restoreFocus.current = false;
                element.focus();
            }
        },
        [setFirstField],
    );
    const formRef = useCallback(
        (element: HTMLDivElement | null) => {
            form.current = element;
            const first = element?.querySelector<HTMLElement>(focusableSelector) ?? null;
            setFirstField?.(first);
            if (replacing) first?.focus();
        },
        [replacing, setFirstField],
    );

    if (image && !replacing) {
        const file = (
            <SettingsRow label={i18n('file')}>
                {(labelId) => (
                    <div
                        className={cnHeaderSettings('file')}
                        role="group"
                        aria-labelledby={labelId}
                    >
                        <img className={cnHeaderSettings('preview')} src={image} alt="" />
                        <Text className={cnHeaderSettings('file-name')} variant="body-1" ellipsis>
                            {imageName(image)}
                        </Text>
                        <Button
                            ref={replaceRef}
                            view="flat-secondary"
                            size="s"
                            aria-label={i18n('replace-file')}
                            onClick={() => setReplacing(true)}
                        >
                            <Icon data={ArrowsRotateRight} size={14} />
                        </Button>
                    </div>
                )}
            </SettingsRow>
        );
        return <div className={cnHeaderSettings('image')}>{children(file)}</div>;
    }

    const closeForm = () => {
        restoreFocus.current = true;
        setError(null);
        setReplacing(false);
    };

    const cancelForm = () => {
        if (uploading.current) cancelUpload?.();
        if (image) closeForm();
        else onClose();
    };

    const submitLink = (params: ImageFormSubmitParams) => {
        const address = safeImageUrl(params.url);
        if (!address) {
            setError(i18n('link-error'));
            return;
        }
        closeForm();
        onLink(address);
    };

    const uploadFile = async (file: File, send: (file: File) => Promise<boolean>) => {
        const fileError = imageFileError(file, limits);
        if (fileError) {
            setError(fileError);
            return;
        }
        uploading.current = true;
        setError(null);
        setLoading(true);
        try {
            if (await send(file)) {
                restoreFocus.current = true;
                setReplacing(false);
            }
        } catch {
            failed.current = true;
            setError(i18n('upload-error'));
        } finally {
            uploading.current = false;
            setLoading(false);
        }
    };

    return (
        <div ref={formRef}>
            <ImageForm
                className={cnHeaderSettings('image-form')}
                loading={loading}
                uploadHint={uploadHint(limits) ?? undefined}
                onAttach={upload && (([file]) => uploadFile(file, upload))}
                onSubmit={submitLink}
                onCancel={cancelForm}
            />
            {error && (
                <Text role="alert" variant="body-1" color="danger">
                    {error}
                </Text>
            )}
        </div>
    );
}
