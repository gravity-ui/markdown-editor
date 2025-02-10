import React from 'react';

import {Tooltip} from '@gravity-ui/uikit';

import {cn} from '../classname';

import {ToolbarTooltipDelay} from './const';

import './PreviewTooltip.scss';

const b = cn('preview-tooltip');

type PreviewTooltipProps = {
    preview?: React.ReactNode;
    children: React.ReactElement;
};

export const PreviewTooltip: React.FC<PreviewTooltipProps> = ({preview, children}) => {
    return (
        <Tooltip
            placement="right"
            className={b()}
            contentClassName={b('content')}
            disabled={!preview}
            openDelay={ToolbarTooltipDelay.Open}
            closeDelay={ToolbarTooltipDelay.Close}
            content={preview}
        >
            {children}
        </Tooltip>
    );
};
