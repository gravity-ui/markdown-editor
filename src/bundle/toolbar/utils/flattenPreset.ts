import {ToolbarDataType} from '../../../toolbar/types';
import type {MToolbarData, MToolbarItemData} from '../../config';
import type {WToolbarData, WToolbarItemData} from '../types';

export const flattenPreset = <T extends WToolbarData | MToolbarData>(
    config: T,
): T extends WToolbarData ? WToolbarItemData[] : MToolbarItemData[] => {
    return config.flat().reduce<(WToolbarItemData | MToolbarItemData)[]>((acc, item) => {
        if (item.type === ToolbarDataType.ListButton && Array.isArray(item.data)) {
            return acc.concat(item.data);
        }

        acc.push(item as WToolbarItemData | MToolbarItemData);
        return acc;
    }, []) as unknown as T extends WToolbarData ? WToolbarItemData[] : MToolbarItemData[];
};
