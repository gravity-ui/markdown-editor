import type {WidgetDescriptor} from './WidgetDescriptor';
import type {Meta as MetaGeneric} from './meta';

export type Meta = MetaGeneric<WidgetDescriptor>;

export type WidgetSpec = {
    id: string;
    descriptor: WidgetDescriptor;
    // needs for placeholder extension
    pos: number;
};
