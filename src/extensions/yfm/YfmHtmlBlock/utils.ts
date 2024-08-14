import diplodocSanitize, {defaultOptions} from '@diplodoc/transform/lib/sanitize';

type AllowedAttributesType = Record<
    string,
    (string | {name: string; multiple?: boolean | undefined; values: string[]})[]
>;
const defaultAllowedAttributes = defaultOptions.allowedAttributes as AllowedAttributesType;

// yfmHtmlBlock additional css properties white list
const getYfmHtmlBlockWhiteList = () => {
    const whiteList: Record<string, boolean> = {};

    whiteList['align-content'] = true; // default: auto
    whiteList['align-items'] = true; // default: auto
    whiteList['align-self'] = true; // default: auto
    whiteList['column-count'] = true; // default: auto
    whiteList['column-fill'] = true; // default: balance
    whiteList['column-gap'] = true; // default: normal
    whiteList['column-rule'] = true; // default: depending on individual properties
    whiteList['column-rule-color'] = true; // default: current color
    whiteList['column-rule-style'] = true; // default: medium
    whiteList['column-rule-width'] = true; // default: medium
    whiteList['column-span'] = true; // default: none
    whiteList['column-width'] = true; // default: auto
    whiteList.columns = true; // default: depending on individual properties
    whiteList.flex = true; // default: depending on individual properties
    whiteList['flex-basis'] = true; // default: auto
    whiteList['flex-direction'] = true; // default: row
    whiteList['flex-flow'] = true; // default: depending on individual properties
    whiteList['flex-grow'] = true; // default: 0
    whiteList['flex-shrink'] = true; // default: 1
    whiteList['flex-wrap'] = true; // default: nowrap
    whiteList.grid = true; // default: depending on individual properties
    whiteList['grid-area'] = true; // default: depending on individual properties
    whiteList['grid-auto-columns'] = true; // default: auto
    whiteList['grid-auto-flow'] = true; // default: none
    whiteList['grid-auto-rows'] = true; // default: auto
    whiteList['grid-column'] = true; // default: depending on individual properties
    whiteList['grid-column-end'] = true; // default: auto
    whiteList['grid-column-start'] = true; // default: auto
    whiteList['grid-row'] = true; // default: depending on individual properties
    whiteList['grid-row-end'] = true; // default: auto
    whiteList['grid-row-start'] = true; // default: auto
    whiteList['grid-template'] = true; // default: depending on individual properties
    whiteList['grid-template-areas'] = true; // default: none
    whiteList['grid-template-columns'] = true; // default: none
    whiteList['grid-template-rows'] = true; // default: none
    whiteList['justify-content'] = true; // default: auto
    whiteList['justify-items'] = true; // default: auto
    whiteList['justify-self'] = true; // default: auto
    whiteList['object-fit'] = true; // default: fill
    whiteList['object-position'] = true; // default: 50% 50%
    whiteList.order = true; // default: 0
    whiteList.orphans = true; // default: 2
    whiteList['row-gap'] = true;

    return whiteList;
};

// yfmHtmlBlock additional allowedTags
const yfmHtmlBlockAllowedTags = ['link', 'base', 'style'];

// yfmHtmlBlock additional allowedTags
const yfmHtmlBlockAllowedAttributes = {
    link: ['rel', 'href'],
    base: ['target'],
    style: [],
};

const yfmHtmlBlockOptions = {
    ...defaultOptions,
    allowedAttributes: {
        ...defaultAllowedAttributes,
        ...yfmHtmlBlockAllowedAttributes,
    },
    allowedTags:
        typeof defaultOptions.allowedTags === 'boolean'
            ? defaultOptions.allowedTags
            : [...(defaultOptions.allowedTags ?? []), ...yfmHtmlBlockAllowedTags],
    cssWhiteList: {
        ...defaultOptions.cssWhiteList,
        ...getYfmHtmlBlockWhiteList(),
    },
};

export const sanitizeYfmHtmlBlock = (content: string) =>
    diplodocSanitize(content, yfmHtmlBlockOptions);
