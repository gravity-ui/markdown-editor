import React from 'react';

import {useBoolean} from 'react-use';

import {useElementState} from '../react-utils/hooks';

import {ToolbarButtonView} from './ToolbarButton';
import {ToolbarBaseProps, ToolbarButtonPopupData} from './types';

export type ToolbarButtonPopupProps<E> = ToolbarBaseProps<E> & ToolbarButtonPopupData<E>;

export function ToolbarButtonPopup<E>(props: ToolbarButtonPopupProps<E>) {
    const {className, editor, isActive, isEnable, renderPopup, ...buttonProps} = props;

    const [anchorElement, setAnchorElement] = useElementState();
    const [open, setOpen] = useBoolean(false);

    const active = isActive(editor);
    const enabled = isEnable(editor);

    return (
        <>
            <ToolbarButtonView
                {...buttonProps}
                ref={setAnchorElement}
                active={active}
                enabled={enabled}
                className={className}
                onClick={() => setOpen()}
            />
            {open &&
                renderPopup({
                    ...props,
                    anchorElement,
                    hide: () => setOpen(false),
                })}
        </>
    );
}
