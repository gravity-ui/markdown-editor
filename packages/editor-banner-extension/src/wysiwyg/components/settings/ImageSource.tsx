import {type ReactNode, type Ref, useCallback, useEffect, useRef, useState} from 'react';

import {ArrowsRotateRight} from '@gravity-ui/icons';
import {
    ImageForm,
    type ImageFormSubmitParams,
} from '@gravity-ui/markdown-editor/_/forms/ImageForm.js';
import {type LinkParser, normalizeLinkUrl} from '@gravity-ui/markdown-plugin-banner';
import {Button, Icon, Text, useForkRef} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {focusableSelector} from '../../utils/popup';

import {SettingsRow} from './SettingsRow';
import {cnBannerSettings} from './classname';
import {type BannerUploadLimits, imageFileError, imageName, uploadHint} from './image';

type ImageSourceProps = {
    image: string | null;
    limits: BannerUploadLimits;
    parser: LinkParser;
    /** Receives the first control of the source: the replace button or the first form field. */
    firstFieldRef?: Ref<HTMLElement>;
    /** The signal aborts this upload when the form cancels it or unmounts. */
    upload?: (file: File, signal: AbortSignal) => Promise<boolean>;
    onLink: (address: string) => void;
    onClose: () => void;
    children: (file: ReactNode) => ReactNode;
};

export function ImageSource({
    image,
    limits,
    parser,
    firstFieldRef,
    upload,
    onLink,
    onClose,
    children,
}: ImageSourceProps) {
    const [replacing, setReplacing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const restoreFocus = useRef(false);
    const pending = useRef<AbortController | null>(null);
    const failed = useRef(false);
    const form = useRef<HTMLDivElement | null>(null);
    const setFirstField = useForkRef(firstFieldRef);
    useEffect(() => () => pending.current?.abort(), []);
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

    const startReplacing = () => setReplacing(true);
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
                            onClick={startReplacing}
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
        pending.current?.abort();
        if (image) closeForm();
        else onClose();
    };

    const submitLink = (params: ImageFormSubmitParams) => {
        const address = normalizeLinkUrl(parser, params.url);
        if (!address) {
            setError(i18n('link-error'));
            return;
        }
        pending.current?.abort();
        closeForm();
        onLink(address);
    };

    const attachFile = async ([file]: File[]) => {
        if (!file || !upload || pending.current) return;
        const fileError = imageFileError(file, limits);
        if (fileError) {
            setError(fileError);
            return;
        }
        const controller = new AbortController();
        pending.current = controller;
        setError(null);
        setLoading(true);
        try {
            if (await upload(file, controller.signal)) closeForm();
        } catch {
            failed.current = true;
            setError(i18n('upload-error'));
        } finally {
            pending.current = null;
            setLoading(false);
        }
    };

    return (
        <div ref={formRef}>
            <ImageForm
                className={cnBannerSettings('image-form')}
                fields={[]}
                multiple={false}
                accept={limits.imageTypes?.join(',')}
                loading={loading}
                uploadHint={uploadHint(limits)}
                onAttach={upload && attachFile}
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
