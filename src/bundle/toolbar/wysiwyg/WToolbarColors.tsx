import React from 'react';

import {ActionStorage} from '../../../core';
import {ToolbarBaseProps} from '../../../toolbar';
import {ToolbarColors} from '../custom/ToolbarColors';

export type WToolbarColorsProps = ToolbarBaseProps<ActionStorage>;

export const WToolbarColors: React.FC<WToolbarColorsProps> = ({
    className,
    editor,
    focus,
    onClick,
}) => {
    const action = editor.actions.colorify;
    const currentColor = action.meta();

    return (
        <ToolbarColors
            active={action.isActive()}
            enable={action.isEnable()}
            currentColor={currentColor}
            exec={(color) => {
                action.run({color: color === currentColor ? '' : color});
            }}
            className={className}
            focus={focus}
            onClick={onClick}
            withDefault
        />
    );
};
