import type {AttributeSpec} from 'prosemirror-model';

import {
    FileSpecialAttr,
    FILE_TOKEN,
    FILE_TO_LINK_ATTRS_MAP,
    KNOWN_ATTRS as FILE_KNOWN_ATTRS,
    REQUIRED_ATTRS as FILE_REQUIRED_ATTRS,
} from '@doc-tools/transform/lib/plugins/file/const';

export const yfmFileNodeName = FILE_TOKEN;

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

export const fileNodeAttrsSpec: Record<string, AttributeSpec> = {};
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
