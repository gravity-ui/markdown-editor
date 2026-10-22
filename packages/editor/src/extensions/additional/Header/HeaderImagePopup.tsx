import {useState} from 'react';

import {Popup, useToaster} from '@gravity-ui/uikit';
import {useMountedState} from 'react-use';

import type {EditorView} from '#pm/view';
import {ImageForm} from 'src/forms/ImageForm';
import {i18n as formsI18n} from 'src/i18n/forms';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {safeImageUrl} from './HeaderSpecs/dom';
import {setHeaderMedia} from './commands';
import {uploadHeaderImage} from './plugins/imageUpload';

export function HeaderImagePopup({
    editorView,
    getHeaderPos,
    fileUploadHandler,
    anchorElement,
    onClose,
}: {
    editorView: EditorView;
    getHeaderPos: () => number | undefined;
    fileUploadHandler?: FileUploadHandler;
    anchorElement: HTMLElement;
    onClose: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const isMounted = useMountedState();
    const toaster = useToaster();
    const showError = (title: string) =>
        toaster.add({name: 'header-media-upload', theme: 'danger', title});
    return (
        <Popup
            open
            anchorElement={anchorElement}
            placement={['bottom-start', 'top-start', 'bottom-end', 'top-end']}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <ImageForm
                className="g-md-header-image-popup"
                variant="source"
                multiple={false}
                autoFocus
                loading={loading}
                uploadHint={`${formsI18n('image_upload_help')} ${i18n('image_size')}`}
                onCancel={onClose}
                onSubmit={({url}) => {
                    const pos = getHeaderPos();
                    const src = safeImageUrl(url);
                    if (!src) {
                        showError(i18n('image_url_error'));
                        return;
                    }
                    if (pos !== undefined && !editorView.isDestroyed && editorView.editable) {
                        setHeaderMedia(pos, {src, name: '', enabled: 'true'})(
                            editorView.state,
                            editorView.dispatch,
                        );
                        onClose();
                    }
                }}
                onAttach={
                    fileUploadHandler &&
                    (async ([file]) => {
                        const pos = getHeaderPos();
                        if (
                            !file ||
                            pos === undefined ||
                            editorView.isDestroyed ||
                            !editorView.editable
                        )
                            return;
                        setLoading(true);
                        const result = await uploadHeaderImage(
                            editorView,
                            pos,
                            fileUploadHandler,
                            'media',
                            file,
                        );
                        if (!isMounted()) return;
                        setLoading(false);
                        if (result === 'done') onClose();
                        else if (result === 'failed') showError(i18n('image_error'));
                    })
                }
            />
        </Popup>
    );
}
