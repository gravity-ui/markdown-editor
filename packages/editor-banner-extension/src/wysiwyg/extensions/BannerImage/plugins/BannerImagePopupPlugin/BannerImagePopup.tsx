import {type RefObject, memo, useEffect, useMemo, useRef} from 'react';

import {type Placement, flip, limitShift, offset, shift} from '@floating-ui/react';
import {Button, Popup, type PopupProps, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import type {BannerUploadLimits} from '../../../../plugins/BannerUploadPlugin';
import {PopupLayer} from '../../../PopupLayer';
import {TabOutClose} from '../../../TabOutClose';
import {belowBlockToolbar} from '../../../placement';
import {nodeAnchor} from '../../../popup';
import {ImageSource, cnBannerSettings} from '../../../settings';

const NO_FOCUS = -1;
const OFFSET = 4;

type BannerImagePopupProps = {
    anchor: HTMLElement;
    placement: Placement[];
    block: () => Element | null;
    toolbar: () => HTMLElement | null | undefined;
    src: string | null;
    limits: BannerUploadLimits;
    focusOnOpen: boolean;
    firstField: RefObject<HTMLElement>;
    onLayer: (layer: HTMLDivElement | null) => void;
    upload?: (file: File) => Promise<boolean>;
    cancelUpload: () => void;
    onChange: (src: string) => void;
    onReset: () => void;
    onOpenChange: NonNullable<PopupProps['onOpenChange']>;
    onClose: () => void;
};

export const BannerImagePopup = memo<BannerImagePopupProps>(function BannerImagePopup({
    anchor,
    placement,
    block,
    toolbar,
    src,
    limits,
    focusOnOpen,
    firstField,
    onLayer,
    upload,
    cancelUpload,
    onChange,
    onReset,
    onOpenChange,
    onClose,
}) {
    const anchorElement = useMemo(() => nodeAnchor(anchor), [anchor]);
    const middlewares = useMemo(
        () => [
            offset(OFFSET),
            shift({padding: OFFSET, limiter: limitShift({offset: OFFSET})}),
            belowBlockToolbar(block, toolbar),
            flip({padding: OFFSET, fallbackPlacements: placement.slice(1)}),
        ],
        [block, toolbar, placement],
    );
    const focusForm = useRef(false);
    useEffect(() => {
        if (src || !focusForm.current) return;
        focusForm.current = false;
        firstField.current?.focus();
    }, [src, firstField]);
    const reset = () => {
        focusForm.current = true;
        onReset();
    };
    return (
        <PopupLayer onLayer={onLayer}>
            <Popup
                open
                className={cnBannerSettings('image-popup')}
                returnFocus={false}
                anchorElement={anchorElement}
                placement={placement[0]}
                floatingMiddlewares={middlewares}
                initialFocus={focusOnOpen ? firstField : NO_FOCUS}
                onOpenChange={onOpenChange}
            >
                <TabOutClose onClose={onClose}>
                    <div
                        className={cnBannerSettings('popup', {untitled: true})}
                        role="dialog"
                        aria-label={i18n('image')}
                        data-qa="banner-image-popup"
                        tabIndex={-1}
                    >
                        <ImageSource
                            image={src}
                            limits={limits}
                            firstFieldRef={firstField}
                            upload={upload}
                            cancelUpload={cancelUpload}
                            onLink={onChange}
                            onClose={onClose}
                        >
                            {(file) => (
                                <>
                                    <div className={cnBannerSettings('title')}>
                                        <Text
                                            as="h2"
                                            className={cnBannerSettings('heading')}
                                            variant="subheader-3"
                                        >
                                            {i18n('image')}
                                        </Text>
                                        <Button view="flat" size="m" onClick={reset}>
                                            {i18n('background-reset')}
                                        </Button>
                                    </div>
                                    {file}
                                </>
                            )}
                        </ImageSource>
                    </div>
                </TabOutClose>
            </Popup>
        </PopupLayer>
    );
});
