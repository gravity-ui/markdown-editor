import {
    FILE_KNOWN_ATTRS,
    FILE_REQUIRED_ATTRS,
    FILE_TOKEN,
    FILE_TO_LINK_ATTRS_MAP,
    FileHtmlAttr,
    type FileSpecialAttr,
} from '@diplodoc/file-extension';
import type {AttributeSpec} from 'prosemirror-model';

export const yfmFileNodeName = FILE_TOKEN;

export const YfmFileAttr = {
    Markup: 'data-markup',
    Name: FileHtmlAttr.Download,
    Link: FileHtmlAttr.Href,
    ReferrerPolicy: FileHtmlAttr.ReferrerPolicy,
    Rel: FileHtmlAttr.Rel,
    Target: FileHtmlAttr.Target,
    Type: FileHtmlAttr.Type,
    Lang: FileHtmlAttr.HrefLang,
} as const;

export const YFM_FILE_DIRECTIVE_ATTRS: readonly string[] = [
    YfmFileAttr.ReferrerPolicy,
    YfmFileAttr.Rel,
    YfmFileAttr.Target,
    YfmFileAttr.Type,
    YfmFileAttr.Lang,
];

export const KNOWN_ATTRS: readonly string[] = FILE_KNOWN_ATTRS.map((attrName) => {
    if (attrName in FILE_TO_LINK_ATTRS_MAP)
        return FILE_TO_LINK_ATTRS_MAP[attrName as FileSpecialAttr];
    return attrName;
});

export const REQUIRED_ATTRS = FILE_REQUIRED_ATTRS.map((attrName) => {
    if (attrName in FILE_TO_LINK_ATTRS_MAP)
        return FILE_TO_LINK_ATTRS_MAP[attrName as FileSpecialAttr];
    return attrName;
});

export const fileNodeAttrsSpec: Record<string, AttributeSpec> = {
    [YfmFileAttr.Markup]: {default: null},
};
for (const attrName of KNOWN_ATTRS) {
    const attrSpec: AttributeSpec = (fileNodeAttrsSpec[attrName] = {});
    if (!REQUIRED_ATTRS.includes(attrName)) {
        attrSpec.default = null;
    }
}

export const LINK_TO_FILE_ATTRS_MAP: Record<string, string> = {};
for (const [key, value] of Object.entries(FILE_TO_LINK_ATTRS_MAP)) {
    LINK_TO_FILE_ATTRS_MAP[value] = key;
}
