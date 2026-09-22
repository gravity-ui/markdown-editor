import {markTypeFactory} from 'src/utils/schema';

export const linkMarkName = 'link';
export const linkType = markTypeFactory(linkMarkName);

export enum LinkAttr {
    Href = 'href',
    Title = 'title',
    // tech attributes
    IsPlaceholder = 'is-placeholder',
    RawLink = 'raw-link',
}
