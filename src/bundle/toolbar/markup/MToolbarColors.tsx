import {colorify} from '../../../markup/commands';
import type {CodeEditor} from '../../../markup/editor';
import {ToolbarColors} from '../custom/ToolbarColors';
import type {ToolbarBaseProps} from '../types';

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
