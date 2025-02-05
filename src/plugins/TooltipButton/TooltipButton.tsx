import {type ReactNode, useLayoutEffect, useRef, useState} from 'react';

import {Ellipsis} from '@gravity-ui/icons';
import {Button, Icon, Popup, PopupPlacement, PopupProps} from '@gravity-ui/uikit';

import {useBooleanState} from '../../react-utils';

type TooltipButtonProps = Pick<PopupProps, 'onOutsideClick'> & {
    domRef: HTMLElement | null;
    children?: React.ReactNode;
};

export const TooltipButton: React.FC<TooltipButtonProps> = ({domRef, onOutsideClick, children}) => {
    const [width, setWidth] = useState(0);
    const [open, , hide, toggleOpen] = useBooleanState(false);
    const placement: PopupPlacement = ['bottom-end', 'bottom-start'];
    const ref = useRef<HTMLDivElement>(null);
    const childrenRef = useRef<ReactNode>(children);

    useLayoutEffect(() => {
        if (ref.current?.clientWidth) {
            setWidth(ref.current?.clientWidth);
        }
    }, [ref.current?.clientWidth]);

    return (
        <Popup
            open
            keepMounted={false}
            hasArrow={false}
            anchorRef={{current: domRef}}
            placement={'right-start'}
            offset={[3, -(width + 3)]}
            onOutsideClick={onOutsideClick}
            modifiers={[
                {
                    name: 'preventOverflow',
                    enabled: false,
                },
            ]}
        >
            <Button onClick={toggleOpen} ref={ref} size="s" view={open ? 'normal' : 'raised'}>
                <Icon data={Ellipsis} />
            </Button>
            <Popup open={open} anchorRef={ref} onClose={hide} placement={placement}>
                {childrenRef.current}
            </Popup>
        </Popup>
    );
};
