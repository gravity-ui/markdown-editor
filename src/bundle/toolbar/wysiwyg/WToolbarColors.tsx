import {ToolbarColors, type ToolbarColorsProps} from '../custom/ToolbarColors';
import type {WToolbarBaseProps} from '../types';

export type WToolbarColorsProps = WToolbarBaseProps & Pick<ToolbarColorsProps, 'disablePortal'>;

export const WToolbarColors: React.FC<WToolbarColorsProps> = ({
    disablePortal,
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
            disablePortal={disablePortal}
            className={className}
            focus={focus}
            onClick={onClick}
            withDefault
        />
    );
};
