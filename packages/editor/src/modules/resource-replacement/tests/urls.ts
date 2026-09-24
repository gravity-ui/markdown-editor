import MarkdownIt from 'markdown-it';

const {normalizeLink, validateLink} = new MarkdownIt('zero');
export const defaultResourceUrls = {normalizeLink, validateLink};
