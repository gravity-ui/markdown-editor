export const headerTitleTokenName = 'header-title';
export const headerTitleClassName = 'g-md-header-title-plugin';

export const headerTitleSizes = [1, 2, 3, 4, 5, 6] as const;
export const headerTitleColors = [
    'auto',
    'gray',
    'yellow',
    'orange',
    'red',
    'green',
    'blue',
    'violet',
] as const;
export type HeaderTitleSize = (typeof headerTitleSizes)[number];
export type HeaderTitleColor = (typeof headerTitleColors)[number];
export type HeaderTitle = {size: HeaderTitleSize; color: HeaderTitleColor};

export const headerTitleDefaults: Readonly<HeaderTitle> = {size: 2, color: 'auto'};
