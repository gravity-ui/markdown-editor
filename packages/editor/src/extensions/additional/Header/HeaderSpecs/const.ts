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
export type HeaderHeightValue = (typeof HeaderHeight)[keyof typeof HeaderHeight];

export const HEADER_DEFAULT_HEIGHT: HeaderHeightValue = HeaderHeight.S;
