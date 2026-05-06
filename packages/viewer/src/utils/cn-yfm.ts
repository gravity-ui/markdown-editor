import {type ClassNameList, cn} from '@bem-react/classname';

const b = cn('yfm');

export type YFMMods = {
    /** Disable list counter reset */
    'no-list-reset'?: boolean;
    /** Disable striped table rows */
    'no-stripe-table'?: boolean;
    [key: string]: string | boolean | number | undefined;
};

export const cnYFM: (mods?: YFMMods | null, mix?: ClassNameList) => string = b;
