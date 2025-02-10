import React from 'react';

import type {ActionStorage} from '../../../core';
import type {ToolbarBaseProps} from '../../../toolbar/types';
import {wHeadingListConfig} from '../../config/w-heading-config';
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
