import React from 'react';

import {colorify} from '../../../markup/commands';
import type {CodeEditor} from '../../../markup/editor';
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
                colorify(editor.cm, color);
            }}
            className={className}
            focus={focus}
            onClick={onClick}
        />
    );
};
