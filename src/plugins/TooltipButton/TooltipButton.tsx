import {useLayoutEffect, useState} from 'react';

import {Ellipsis} from '@gravity-ui/icons';
import {Button, Icon, Popup, type PopupPlacement, type PopupProps} from '@gravity-ui/uikit';

import {useBooleanState, useElementState} from '../../react-utils';

/** @deprecated */
type TooltipButtonProps = Pick<PopupProps, 'onOutsideClick'> & {
    domElem: HTMLElement | null;
    children?: React.ReactNode;
};

/** @deprecated */
export const TooltipButton: React.FC<TooltipButtonProps> = ({
    domElem,
    children,
    onOutsideClick,
}) => {
    const [width, setWidth] = useState(0);
    const [open, , hide, toggleOpen] = useBooleanState(false);
    const placement: PopupPlacement = ['bottom-end', 'bottom-start'];
    const [anchor, setAnchor] = useElementState();

    useLayoutEffect(() => {
        if (anchor?.clientWidth) {
            setWidth(anchor.clientWidth);
        }
    }, [anchor?.clientWidth]);

    return (
        <Popup
            open
            keepMounted={false}
            hasArrow={false}
            anchorElement={domElem}
            placement={'right-start'}
            offset={{crossAxis: 3, mainAxis: -(width + 3)}}
            onOutsideClick={onOutsideClick}
        >
            <Button onClick={toggleOpen} ref={setAnchor} size="s" view={open ? 'normal' : 'raised'}>
                <Icon data={Ellipsis} />
            </Button>
            <Popup open={open} anchorElement={anchor} onClose={hide} placement={placement}>
                {children}
            </Popup>
        </Popup>
    );
};
