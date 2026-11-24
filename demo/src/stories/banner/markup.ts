const bannerContentMarkup = (paragraphs: readonly string[]) =>
    [':::banner-content', ...paragraphs, ':::'].join('\n\n');

const bannerContentMarks =
    'Text with **bold**, *italic*, ++underlined++, ~~strikethrough~~ and `monospace` text and a [link](https://example.org).';

const inBanner = (content: string) => `:::banner{height="s" width="m"}\n\n${content}\n\n:::`;

/** A description with formatted text and an empty description. */
export const bannerDescriptionMarkup = [
    inBanner(bannerContentMarkup(['Portal description.', bannerContentMarks])),
    inBanner(bannerContentMarkup([])),
    'After',
].join('\n\n');
