import {cn} from 'src/classname';

import {Colors} from '../../Color/const';

export const statusNodeName = 'status';
export const statusDirectiveName = 'status';
export const statusColorDomAttr = 'data-color';

export enum StatusAttr {
    Text = 'text',
    Color = 'color',
}

export const defaultStatusColor = Colors.Gray;

export const statusColors: readonly Colors[] = [
    Colors.Gray,
    Colors.Blue,
    Colors.Green,
    Colors.Yellow,
    Colors.Orange,
    Colors.Red,
    Colors.Violet,
];

export const statusCn = cn('status');
