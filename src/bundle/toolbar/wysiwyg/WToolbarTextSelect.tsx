import React from 'react';

import {ActionStorage} from '../../../core';
import {ToolbarBaseProps} from '../../../toolbar';
import {wHeadingListConfig} from '../../config/wysiwyg';
import {ToolbarSelect} from '../ToolbarSelect';

export type WToolbarTextSelectProps = ToolbarBaseProps<ActionStorage> & {};

export const WToolbarTextSelect: React.FC<WToolbarTextSelectProps> = ({
    focus,
    onClick,
    editor,
    className,
}) => {
    const items = React.useMemo(() => wHeadingListConfig.data, []);
    return (
        <ToolbarSelect
            items={items}
            focus={focus}
            editor={editor}
            onClick={onClick}
            className={className}
        />
    );
};
