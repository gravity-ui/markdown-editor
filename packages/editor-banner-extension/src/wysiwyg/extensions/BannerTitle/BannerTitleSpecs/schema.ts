import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    bannerTitleAttrs,
    bannerTitleClassName,
    bannerTitleDefaults,
    bannerTitleFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../i18n';
import type {BannerPartSpec} from '../../Banner/parts';
import {attrSpecs, placeholderSpec} from '../../schema';

import {bannerTitleNodeName} from './const';

/** A paragraph of text without formatting, so the title keeps all of it. */
function plainParagraph(paragraph: Node) {
    let plain = true;
    paragraph.forEach((child) => {
        plain &&= child.isText && !child.marks.length;
    });
    return plain;
}

const bannerPart: BannerPartSpec = {
    part: 'title',
    create: (type) => type.create(null, type.schema.text(i18n('preview-title'))),
    adopt: (paragraph, type) =>
        plainParagraph(paragraph) ? type.create(null, paragraph.content) : null,
};

export const BannerTitleSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = placeholderSpec(builder, bannerTitleNodeName, () =>
        i18n('title-placeholder'),
    );
    builder.addNodeSpec(bannerTitleNodeName, () => ({
        group: 'block',
        content: 'text*',
        marks: '',
        defining: true,
        selectionContext: false,
        complex: 'leaf',
        attrs: attrSpecs(bannerTitleDefaults),
        parseDOM: [
            {
                tag: `div.${bannerTitleClassName}`,
                getAttrs: (dom) => bannerTitleFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', bannerTitleAttrs(node.attrs), 0],
        placeholder,
        bannerPart,
    }));
};
