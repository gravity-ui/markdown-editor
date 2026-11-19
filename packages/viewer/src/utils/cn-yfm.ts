import {type ClassNameList, cn} from '@bem-react/classname';

const b = cn('yfm');

type ModifierValue = string | boolean | number | undefined;

export type YFMMods<CustomMods = Record<string, ModifierValue>> = {
    /** Disable list counter reset */
    'no-list-reset'?: boolean;
    /** Disable striped table rows */
    'no-stripe-table'?: boolean;
} & CustomMods;

export const cnYFM: <CustomMods extends {[Key in keyof CustomMods]: ModifierValue} = YFMMods>(
    mods?: YFMMods<NoInfer<CustomMods>> | null,
    mix?: ClassNameList,
) => string = b;
