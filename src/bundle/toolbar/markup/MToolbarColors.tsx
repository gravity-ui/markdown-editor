import React from 'react';

import type {CodeEditor} from '../../../markup';
import {colorify} from '../../../markup/commands';
import {ToolbarBaseProps} from '../../../toolbar';
import {ToolbarColors} from '../custom/ToolbarColors';

export type MToolbarColorsProps = ToolbarBaseProps<CodeEditor>;

export const MToolbarColors: React.FC<MToolbarColorsProps> = ({
    className,
    editor,
    focus,
    onClick,
}) => {
    return (
        <ToolbarColors
            enable
            exec={(color) => {
                colorify(color)(editor.cm);
            }}
            className={className}
            focus={focus}
            onClick={onClick}
        />
    );
};
