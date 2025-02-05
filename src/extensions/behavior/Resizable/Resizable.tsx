import {cn} from '../../../classname';

import './Resizable.scss';

const b = cn('resizable');

interface ResizerProps {
    onMouseDown: (event: React.MouseEvent<HTMLElement>) => void;
    direction: 'left' | 'right';
}
const Resizer: React.FC<ResizerProps> = ({onMouseDown, direction}) => (
    <div
        className={b('resizer-wrapper', {[direction]: true})}
        role="button"
        tabIndex={0}
        onMouseDown={onMouseDown}
    >
        <div className={b('resizer')} />
    </div>
);

export interface ResizableProps {
    children: React.ReactNode;
    onResizeLeft: (event: React.MouseEvent<HTMLElement>) => void;
    onResizeRight: (event: React.MouseEvent<HTMLElement>) => void;
    hover?: boolean;
    resizing?: boolean;
}

export const Resizable: React.FC<ResizableProps> = ({
    hover,
    resizing,
    children,
    onResizeLeft,
    onResizeRight,
}) => (
    <div className={b({hover, resizing})}>
        {children}
        <Resizer onMouseDown={onResizeLeft} direction="left" />
        <Resizer onMouseDown={onResizeRight} direction="right" />
    </div>
);
