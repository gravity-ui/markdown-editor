import {Popup, type PopupPlacement} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {LinkForm, type LinkFormProps} from '../../../../forms/LinkForm';
import {i18n} from '../../../../i18n/widgets';
import {useElementState} from '../../../../react-utils';

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
    const [anchor, setAnchor] = useElementState();
    return (
        <>
            <span ref={setAnchor} className={b()}>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a href="#">{i18n('link')}</a>
            </span>
            <Popup open modal onOpenChange={onCancel} anchorElement={anchor} placement={placement}>
                <LinkForm autoFocus onSubmit={onSubmit} onCancel={onCancel} />
            </Popup>
        </>
    );
};
