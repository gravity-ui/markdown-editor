export const headerNodeName = 'header';
export const headerDirectiveName = 'header';
export const headerTokenName = 'header';

export const headerClassName = 'g-md-header';

export const HeaderAttr = {
    Height: 'height',
} as const;

export const HeaderHeight = {
    S: 's',
    M: 'm',
    L: 'l',
} as const;
export type HeaderHeight = (typeof HeaderHeight)[keyof typeof HeaderHeight];

export const HEADER_DEFAULT_HEIGHT: HeaderHeight = HeaderHeight.S;
