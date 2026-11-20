import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    headerTitleAttrs,
    headerTitleClassName,
    headerTitleDefaults,
    headerTitleFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../i18n';
import type {HeaderPartSpec} from '../../Header/parts';
import {attrSpecs, placeholderSpec} from '../../schema';

import {headerTitleNodeName} from './const';

/** A paragraph of text without formatting, so the title keeps all of it. */
function plainParagraph(paragraph: Node) {
    let plain = true;
    paragraph.forEach((child) => {
        plain &&= child.isText && !child.marks.length;
    });
    return plain;
}

const headerPart: HeaderPartSpec = {
    part: 'title',
    create: (type) => type.create(null, type.schema.text(i18n('preview-title'))),
    adopt: (paragraph, type) =>
        plainParagraph(paragraph) ? type.create(null, paragraph.content) : null,
};

export const HeaderTitleSchemaSpecs: ExtensionAuto = (builder) => {
    const placeholder = placeholderSpec(builder, headerTitleNodeName, () =>
        i18n('title-placeholder'),
    );
    builder.addNodeSpec(headerTitleNodeName, () => ({
        group: 'block',
        content: 'text*',
        marks: '',
        defining: true,
        selectionContext: false,
        complex: 'leaf',
        attrs: attrSpecs(headerTitleDefaults),
        parseDOM: [
            {
                tag: `div.${headerTitleClassName}`,
                getAttrs: (dom) => headerTitleFromAttrs((name) => dom.getAttribute(name)),
            },
        ],
        toDOM: (node) => ['div', headerTitleAttrs(node.attrs), 0],
        placeholder,
        headerPart,
    }));
};
