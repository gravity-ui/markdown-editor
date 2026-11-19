/** The Markdown of a description as the editor writes it. */
export const headerContentMarkup = (paragraphs: readonly string[]) =>
    `:::header-content\n\n${paragraphs.map((text) => `${text}\n\n`).join('')}:::`;

export const description = headerContentMarkup(['Portal description.']);
