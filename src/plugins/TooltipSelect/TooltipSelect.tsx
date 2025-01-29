import {useLayoutEffect, useRef, useState} from 'react';

import {
    ArrowToggle,
    Button,
    Popup,
    PopupProps,
    Select,
    SelectOption,
    SelectOptionGroup,
} from '@gravity-ui/uikit';

import {useBooleanState} from '../../react-utils';

type TooltipButtonProps = Pick<PopupProps, 'onOutsideClick'> & {
    domRef: HTMLElement | null;
    buttonTitle?: string;
    items?: SelectOption[] | SelectOptionGroup[];
    onUpdate: (s: string) => void;
    withSearch?: boolean;
};

export const TooltipButton: React.FC<TooltipButtonProps> = ({
    domRef,
    buttonTitle = 'Settings',
    items,
    onUpdate,
    withSearch,
    onOutsideClick,
}) => {
    const [width, setWidth] = useState(0);
    const [open, , , toggleOpen] = useBooleanState(false);
    const ref = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        if (ref.current?.clientWidth) {
            setWidth(ref.current?.clientWidth);
        }
    }, [ref.current?.clientWidth, buttonTitle]);

    return (
        <Popup
            open
            keepMounted={false}
            hasArrow={false}
            anchorElement={domRef}
            placement={'right-start'}
            offset={{crossAxis: 10, mainAxis: -(width + 10)}}
            onOutsideClick={onOutsideClick}
        >
            <Select
                onOpenChange={toggleOpen}
                renderControl={() => (
                    <Button ref={ref} view={'flat'}>
                        {buttonTitle}
                        <ArrowToggle direction={open ? 'top' : 'bottom'} />
                    </Button>
                )}
                options={items}
                onUpdate={(v) => onUpdate(v[0])}
                filterable={withSearch}
            />
        </Popup>
    );
};
