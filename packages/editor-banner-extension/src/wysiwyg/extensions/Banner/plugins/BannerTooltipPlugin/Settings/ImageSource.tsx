import {type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState} from 'react';

import {ArrowsRotateRight} from '@gravity-ui/icons';
import {ImageForm, type ImageFormSubmitParams} from '@gravity-ui/markdown-editor';
import {safeImageUrl} from '@gravity-ui/markdown-plugin-banner';
import {Button, Icon, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../../i18n';
import {SettingsRow, cnBannerSettings} from '../../../../settings';
import {type BannerImageLimits, imageFileError} from '../../BannerUploadPlugin';

import {formatImageSize, imageName, uploadHint} from './utils';

const focusableSelector = 'input:not([type="file"]), button, [tabindex="0"]';

const keepEnterInField = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    if (event.target instanceof HTMLInputElement) event.preventDefault();
};

type ImageSourceProps = {
    image: string | null;
    limits: BannerImageLimits;
    upload?: (file: File) => Promise<boolean>;
    cancelUpload?: () => void;
    onLink: (address: string) => void;
    onClose: () => void;
    children: (file: ReactNode) => ReactNode;
};

export function ImageSource({
    image,
    limits,
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
    const replaceRef = useCallback((element: HTMLButtonElement | null) => {
        if (element && restoreFocus.current) {
            restoreFocus.current = false;
            element.focus();
        }
    }, []);
    const formRef = useCallback(
        (element: HTMLDivElement | null) => {
            form.current = element;
            const first = element?.querySelector<HTMLElement>(focusableSelector) ?? null;
            if (replacing) first?.focus();
        },
        [replacing],
    );

    if (image && !replacing) {
        const file = (
            <SettingsRow label={i18n('file')}>
                {(labelId) => (
                    <div
                        className={cnBannerSettings('file')}
                        role="group"
                        aria-labelledby={labelId}
                    >
                        <img className={cnBannerSettings('preview')} src={image} alt="" />
                        <Text className={cnBannerSettings('file-name')} variant="body-1" ellipsis>
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
        return <div className={cnBannerSettings('image')}>{children(file)}</div>;
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
            setError(
                fileError === 'type'
                    ? i18n('upload-error-type')
                    : i18n('upload-error-size', {size: formatImageSize(limits.maxImageSize ?? 0)}),
            );
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
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div ref={formRef} onKeyDown={keepEnterInField}>
            <ImageForm
                className={cnBannerSettings('image-form')}
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
