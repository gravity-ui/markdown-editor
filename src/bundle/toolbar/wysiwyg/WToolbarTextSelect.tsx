import type {ActionStorage} from '../../../core';
import type {ToolbarBaseProps} from '../../../toolbar/types';
import {wHeadingListConfig} from '../../config/w-heading-config';
import {ToolbarSelect, type ToolbarSelectProps} from '../ToolbarSelect';

export type WToolbarTextSelectProps = ToolbarBaseProps<ActionStorage> &
    Pick<ToolbarSelectProps, 'disablePortal'>;

export const WToolbarTextSelect: React.FC<WToolbarTextSelectProps> = ({
    focus,
    onClick,
    editor,
    className,
    disablePortal,
}) => {
    return (
        <ToolbarSelect
            items={wHeadingListConfig.data}
            focus={focus}
            editor={editor}
            onClick={onClick}
            className={className}
            disablePortal={disablePortal}
        />
    );
};
