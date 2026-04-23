import {colorify} from '../../../markup/commands';
import {ToolbarColors} from '../custom/ToolbarColors';
import type {MToolbarBaseProps} from '../types';

export type MToolbarColorsProps = MToolbarBaseProps;

export const MToolbarColors: React.FC<MToolbarColorsProps> = ({
    className,
    editor,
    focus,
    onClick,
}) => {
    // TODO: @makhnatkin check markup mode
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
