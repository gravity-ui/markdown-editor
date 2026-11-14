export const headerImageTokenName = 'header-image';
export const headerImageClassName = 'g-md-header-image-plugin';

/**
 * The address is `null` when it is missing or unsafe: such an image is not rendered.
 * An empty alternative text marks a decorative image; without a title there is no tooltip.
 */
export type HeaderImage = {src: string | null; alt: string; title: string | null};

export const headerImageDefaults: Readonly<HeaderImage> = {src: null, alt: '', title: null};
