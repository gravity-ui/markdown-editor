const headerContentMarkup = (paragraphs: readonly string[]) =>
    [':::header-content', ...paragraphs, ':::'].join('\n\n');

const headerContentMarks =
    'Text with **bold**, *italic*, ++underlined++, ~~strikethrough~~ and `monospace` text and a [link](https://example.org).';

const inHeader = (content: string) => `:::header{height="s" width="m"}\n\n${content}\n\n:::`;

/** A description with formatted text and an empty description. */
export const headerDescriptionMarkup = [
    inHeader(headerContentMarkup(['Portal description.', headerContentMarks])),
    inHeader(headerContentMarkup([])),
    'After',
].join('\n\n');
