import {type KeyboardEvent, type RefObject, memo, useEffect, useMemo, useRef} from 'react';

import {type Placement, flip, limitShift, offset, shift} from '@floating-ui/react';
import type {LinkParser} from '@gravity-ui/markdown-plugin-banner';
import {Button, Popup, type PopupProps, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {PopupLayer} from '../../../../components/PopupLayer';
import {
    type BannerUploadLimits,
    ImageSource,
    cnBannerSettings,
} from '../../../../components/settings';
import {belowBlockToolbar} from '../../../../utils/placement';
import {closeOnTabOut, nodeAnchor} from '../../../../utils/popup';

const NO_FOCUS = -1;
const OFFSET = 4;

type BannerImagePopupProps = {
    anchor: HTMLElement;
    placement: Placement[];
    block: () => Element | null;
    toolbar: () => HTMLElement | null | undefined;
    src: string | null;
    limits: BannerUploadLimits;
    parser: LinkParser;
    focusOnOpen: boolean;
    firstField: RefObject<HTMLElement>;
    onLayer: (layer: HTMLDivElement | null) => void;
    upload?: (file: File, signal: AbortSignal) => Promise<boolean>;
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
    parser,
    focusOnOpen,
    firstField,
    onLayer,
    upload,
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
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => closeOnTabOut(event, onClose);
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
                <dialog
                    open
                    className={cnBannerSettings('dialog', [
                        cnBannerSettings('popup', {untitled: true}),
                    ])}
                    aria-label={i18n('image')}
                    data-qa="banner-image-popup"
                    tabIndex={-1}
                    onKeyDown={handleKeyDown}
                >
                    <ImageSource
                        image={src}
                        limits={limits}
                        parser={parser}
                        firstFieldRef={firstField}
                        upload={upload}
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
                </dialog>
            </Popup>
        </PopupLayer>
    );
});
