import {useRef} from 'react';

import {useBoolean} from 'react-use';

import {ToolbarButtonView} from './ToolbarButton';
import {ToolbarBaseProps, ToolbarButtonPopupData} from './types';

export type ToolbarButtonPopupProps<E> = ToolbarBaseProps<E> & ToolbarButtonPopupData<E>;

export function ToolbarButtonPopup<E>(props: ToolbarButtonPopupProps<E>) {
    const {className, editor, isActive, isEnable, renderPopup, ...buttonProps} = props;

    const buttonRef = useRef<HTMLElement>(null);
    const [open, setOpen] = useBoolean(false);

    const active = isActive(editor);
    const enabled = isEnable(editor);

    return (
        <>
            <ToolbarButtonView
                {...buttonProps}
                ref={buttonRef}
                active={active}
                enabled={enabled}
                className={className}
                onClick={() => setOpen()}
            />
            {open &&
                renderPopup({
                    ...props,
                    anchorRef: buttonRef,
                    hide: () => setOpen(false),
                })}
        </>
    );
}
