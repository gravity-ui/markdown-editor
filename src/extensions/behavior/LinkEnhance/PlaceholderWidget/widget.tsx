import React from 'react';

import {Popup, PopupPlacement} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {LinkForm, LinkFormProps} from '../../../../forms/LinkForm';
import {i18n} from '../../../../i18n/widgets';

import './widget.scss';

const b = cn('link-placeholder-widget');
const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type LinkPlaceholderWidgetProps = {
    onCancel: () => void;
    onSubmit: LinkFormProps['onSubmit'];
};

export const LinkPlaceholderWidget: React.FC<LinkPlaceholderWidgetProps> = ({
    onCancel,
    onSubmit,
}) => {
    const divRef = React.useRef<HTMLDivElement>(null);

    return (
        <>
            <span ref={divRef} className={b()}>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a href="#">{i18n('link')}</a>
            </span>
            <Popup open onClose={onCancel} anchorRef={divRef} placement={placement}>
                <LinkForm autoFocus onSubmit={onSubmit} onCancel={onCancel} />
            </Popup>
        </>
    );
};
