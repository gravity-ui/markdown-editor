export const headerImageTokenName = 'header-image';
export const headerImageClassName = 'g-md-header-image-plugin';

export type HeaderImage = {src: string | null; alt: string; title: string | null};

export const headerImageDefaults: Readonly<HeaderImage> = {src: null, alt: '', title: null};
