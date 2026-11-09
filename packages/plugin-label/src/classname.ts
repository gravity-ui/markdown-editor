import {cn} from '@bem-react/classname';

import {normalizeLabelColor} from './colors';
import {labelClassName, labelColorAttr} from './const';

export const labelCn = cn(labelClassName);

/** The modifier styles the label; the data attribute carries its color for parsing. */
export function labelAttrs(color: unknown) {
    const normalized = normalizeLabelColor(color);
    return {
        class: labelCn({color: normalized}),
        [labelColorAttr]: normalized,
    };
}

export function labelColorFromAttrs(getAttr: (name: string) => string | null | undefined) {
    return normalizeLabelColor(getAttr(labelColorAttr));
}
