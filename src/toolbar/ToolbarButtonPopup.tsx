import {useBooleanState, useElementState} from '../react-utils/hooks';

import {ToolbarButtonView} from './ToolbarButton';
import type {ToolbarBaseProps, ToolbarButtonPopupData} from './types';

export type ToolbarButtonPopupProps<E> = ToolbarBaseProps<E> & ToolbarButtonPopupData<E>;

export function ToolbarButtonPopup<E>(props: ToolbarButtonPopupProps<E>) {
    const {className, editor, isActive, isEnable, renderPopup, ...buttonProps} = props;

    const [anchorElement, setAnchorElement] = useElementState();
    const [isOpen, , close, toggle] = useBooleanState(false);

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
                onClick={toggle}
            />
            {isOpen &&
                renderPopup({
                    ...props,
                    anchorElement,
                    hide: close,
                })}
        </>
    );
}
