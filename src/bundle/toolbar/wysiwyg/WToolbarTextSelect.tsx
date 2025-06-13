import {wHeadingListConfig} from '../../config/w-heading-config';
import {ToolbarSelect, type ToolbarSelectProps} from '../ToolbarSelect';
import type {WToolbarBaseProps} from '../types';

export type WToolbarTextSelectProps = WToolbarBaseProps & Pick<ToolbarSelectProps, 'disablePortal'>;

export const WToolbarTextSelect: React.FC<WToolbarTextSelectProps> = ({
    focus,
    onClick,
    editor,
    className,
    disablePortal,
    qa = 'md-toolbar-text-select',
}) => {
    return (
        <ToolbarSelect
            qa={qa}
            items={wHeadingListConfig.data}
            focus={focus}
            editor={editor}
            onClick={onClick}
            className={className}
            disablePortal={disablePortal}
        />
    );
};
