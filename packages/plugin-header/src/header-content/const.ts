export const headerContentTokenName = 'header-content';
export const headerContentClassName = 'g-md-header-content-plugin';

/** The levels of a heading: the description takes the font size and the line height of the level. */
export const headerContentSizes = [1, 2, 3, 4, 5, 6] as const;
export type HeaderContentSize = (typeof headerContentSizes)[number];
/** Without a size the description is regular text. */
export type HeaderContent = {size: HeaderContentSize | null};

export const headerContentDefaults: Readonly<HeaderContent> = {size: null};
