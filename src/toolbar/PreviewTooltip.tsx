import {Tooltip} from '@gravity-ui/uikit';

import {cn} from '../classname';

import {ToolbarTooltipDelay} from './const';

import './PreviewTooltip.scss';

const b = cn('preview-tooltip');

type PreviewTooltipProps = {
    preview?: React.ReactNode;
    children: React.ReactElement;
    mobile?: boolean;
};

export const PreviewTooltip: React.FC<PreviewTooltipProps> = ({preview, children, mobile}) => {
    if (!preview) return children;

    return (
        <Tooltip
            placement={['right', 'left']}
            className={b()}
            disabled={!preview || mobile}
            openDelay={ToolbarTooltipDelay.Open}
            closeDelay={ToolbarTooltipDelay.Close}
            content={<div className={b('content')}>{preview}</div>}
        >
            {children}
        </Tooltip>
    );
};
