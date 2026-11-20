import {type KeyboardEvent, type RefObject, memo, useEffect, useMemo, useRef} from 'react';

import {type Placement, flip, limitShift, offset, shift} from '@floating-ui/react';
import {Button, Popup, type PopupProps, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import type {HeaderUploadLimits} from '../../../../plugins/HeaderUploadPlugin';
import {PopupLayer} from '../../../PopupLayer';
import {belowBlockToolbar} from '../../../placement';
import {closeOnTabOut, keepEnterInField, nodeAnchor} from '../../../popup';
import {ImageSource, cnHeaderSettings} from '../../../settings';

const NO_FOCUS = -1;
const OFFSET = 4;

type HeaderImagePopupProps = {
    anchor: HTMLElement;
    placement: Placement[];
    block: () => Element | null;
    toolbar: () => HTMLElement | null | undefined;
    src: string | null;
    limits: HeaderUploadLimits;
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

export const HeaderImagePopup = memo<HeaderImagePopupProps>(function HeaderImagePopup({
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
    const interactions = useMemo(
        () => [
            {
                floating: {
                    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
                        keepEnterInField(event);
                        closeOnTabOut(event, onClose);
                    },
                },
            },
        ],
        [onClose],
    );
    const reset = () => {
        focusForm.current = true;
        onReset();
    };
    return (
        <PopupLayer onLayer={onLayer}>
            <Popup
                open
                className={cnHeaderSettings('image-popup')}
                returnFocus={false}
                anchorElement={anchorElement}
                placement={placement[0]}
                floatingMiddlewares={middlewares}
                initialFocus={focusOnOpen ? firstField : NO_FOCUS}
                floatingInteractions={interactions}
                onOpenChange={onOpenChange}
            >
                <div
                    className={cnHeaderSettings('popup')}
                    role="dialog"
                    aria-label={i18n('image')}
                    data-qa="header-image-popup"
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
                                <div className={cnHeaderSettings('title')}>
                                    <Text
                                        as="h2"
                                        className={cnHeaderSettings('heading')}
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
            </Popup>
        </PopupLayer>
    );
});
