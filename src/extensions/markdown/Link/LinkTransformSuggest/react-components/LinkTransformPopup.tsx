import {Popup} from '@gravity-ui/uikit';

import {LinkTransformMenu, type LinkTransformMenuProps} from './LinkTransformMenu';

export type LinkTransformPopupProps = LinkTransformMenuProps & {
    anchorElement: Element | null;
};

export const LinkTransformPopup: React.FC<LinkTransformPopupProps> = function LinkTransformPopup({
    anchorElement,
    ...props
}) {
    return (
        <Popup open anchorElement={anchorElement}>
            <LinkTransformMenu {...props} />
        </Popup>
    );
};
