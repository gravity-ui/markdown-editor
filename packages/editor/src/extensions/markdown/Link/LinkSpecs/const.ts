import {markTypeFactory} from 'src/utils/schema';

export const linkMarkName = 'link';
export const linkType = markTypeFactory(linkMarkName);

// Unlike \s, this excludes U+FEFF, which can join the URL.
export const leadingWhitespace = /^[\t\n\r\v\f\p{Z}]/u;
export const trailingWhitespace = /[\t\n\r\v\f\p{Z}]+$/u;

export enum LinkAttr {
    Href = 'href',
    Title = 'title',
    // tech attributes
    IsPlaceholder = 'is-placeholder',
    RawLink = 'raw-link',
}
