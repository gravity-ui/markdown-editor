import type {WidgetDescriptor} from './WidgetDescriptor';

export type Meta = {type: 'add'; descriptor: WidgetDescriptor} | {type: 'remove'; id: string};

export type WidgetSpec = {
    id: string;
    descriptor: WidgetDescriptor;
    // needs for placeholder extension
    pos: number;
};
