import type {FC} from 'react';

import {Button, type ButtonButtonProps, Icon, type IconData} from '@gravity-ui/uikit';

import {STOP_EVENT_CLASSNAME} from '../const';

export type ToolbarButtonProps = Pick<
    ButtonButtonProps,
    'onClick' | 'selected' | 'disabled' | 'view'
> & {
    icon: IconData;
    label: string;
    iconSize?: number;
};

export const ToolbarButton: FC<ToolbarButtonProps> = ({icon, label, iconSize = 14, ...props}) => (
    <Button
        view="flat"
        size="s"
        className={STOP_EVENT_CLASSNAME}
        aria-label={label}
        title={label}
        {...props}
    >
        <Icon data={icon} size={iconSize} className={STOP_EVENT_CLASSNAME} />
    </Button>
);
