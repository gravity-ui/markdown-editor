import {useRef} from 'react';

import {Popup, type PopupPlacement, type PopupProps} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {Link, type LinkSubmitParams} from '../../../../forms/Link';
import {i18n} from '../../../../i18n/widgets';
import {useElementState} from '../../../../react-utils';

import './widget.scss';

const b = cn('link-placeholder-widget');
const placement: PopupPlacement = ['bottom-start', 'top-start', 'bottom-end', 'top-end'];

export type LinkPlaceholderWidgetProps = {
    onCancel: () => void;
    onSubmit: (params: LinkSubmitParams) => void;
};

export const LinkPlaceholderWidget: React.FC<LinkPlaceholderWidgetProps> = ({
    onCancel,
    onSubmit,
}) => {
    const [anchor, setAnchor] = useElementState();
    const currentUrlRef = useRef('');
    const currentTextRef = useRef('');

    const handleUrlChange = (url: string) => {
        currentUrlRef.current = url;
    };

    const handleTextChange = (text: string) => {
        currentTextRef.current = text;
    };

    const handleSubmit = (params: LinkSubmitParams) => {
        onSubmit(params);
    };

    const handleOpenChange: NonNullable<PopupProps['onOpenChange']> = (open, _event, reason) => {
        if (open) return;

        if (reason === 'escape-key') {
            onCancel();
            return;
        }

        const url = currentUrlRef.current.trim();
        if (url) {
            onSubmit({url, text: currentTextRef.current});
        } else {
            onCancel();
        }
    };

    return (
        <>
            <span ref={setAnchor} className={b()}>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a href="#">{i18n('link')}</a>
            </span>
            <Popup
                qa="g-md-link-form"
                open
                modal
                onOpenChange={handleOpenChange}
                className={b('popup')}
                anchorElement={anchor}
                placement={placement}
            >
                <Link
                    autoFocus
                    onSubmit={handleSubmit}
                    onUrlChange={handleUrlChange}
                    onTextChange={handleTextChange}
                />
            </Popup>
        </>
    );
};
