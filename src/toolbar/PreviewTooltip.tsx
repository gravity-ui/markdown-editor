import {Tooltip} from '@gravity-ui/uikit';

import {cn} from '../classname';

import {ToolbarTooltipDelay} from './const';

import './PreviewTooltip.scss';

const b = cn('preview-tooltip');

type PreviewTooltipProps = {
    preview?: React.ReactNode;
    children: React.ReactElement;
    disabled?: boolean;
};

export const PreviewTooltip: React.FC<PreviewTooltipProps> = ({preview, children, disabled}) => {
    if (!preview || disabled) return children;

    return (
        <Tooltip
            placement={['right', 'left']}
            className={b()}
            openDelay={ToolbarTooltipDelay.Open}
            closeDelay={ToolbarTooltipDelay.Close}
            content={<div className={b('content')}>{preview}</div>}
        >
            {children}
        </Tooltip>
    );
};
