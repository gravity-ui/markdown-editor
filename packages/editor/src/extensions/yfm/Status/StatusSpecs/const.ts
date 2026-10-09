import {cn} from 'src/classname';

export const statusNodeName = 'status';
export const statusDirectiveName = 'status';
export const statusColorDomAttr = 'data-color';

export enum StatusAttr {
    Text = 'text',
    Color = 'color',
}

/** Declaration order is the order of the swatches in the popover grid. */
export enum StatusColor {
    Gray = 'gray',
    Blue = 'blue',
    Teal = 'teal',
    Green = 'green',
    Lime = 'lime',
    Yellow = 'yellow',
    Orange = 'orange',
    Red = 'red',
    Magenta = 'magenta',
    Purple = 'purple',
}

export const defaultStatusColor = StatusColor.Gray;

export const statusColors: readonly StatusColor[] = Object.values(StatusColor);

export const statusCn = cn('status');
