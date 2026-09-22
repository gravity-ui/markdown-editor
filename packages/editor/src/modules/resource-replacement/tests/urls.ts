import MarkdownIt from 'markdown-it';

// Standalone test editors explicitly opt into standard Markdown URL rules.
const {normalizeLink, validateLink} = new MarkdownIt('zero');
export const defaultResourceUrls = {normalizeLink, validateLink};
