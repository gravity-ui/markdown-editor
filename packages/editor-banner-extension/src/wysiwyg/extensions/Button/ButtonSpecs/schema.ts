import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    buttonAttrs,
    buttonClassName,
    buttonDefaults,
    buttonFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../i18n';
import {singleLine} from '../../directive';
import {attrSpecs, placeholderSpec} from '../../schema';

import {ButtonAttr, buttonNodeName} from './const';
import {buttonLabel} from './utils';

export const ButtonSchemaSpecs: ExtensionAuto = (builder) => {
    builder.addNodeSpec(buttonNodeName, () => ({
        group: 'inline',
        inline: true,
        atom: true,
        selectable: true,
        attrs: attrSpecs({...buttonDefaults, [ButtonAttr.Label]: ''}),
        placeholder: placeholderSpec(
            builder,
            buttonNodeName,
            () => i18n('button-placeholder'),
            false,
        ),
        parseDOM: [
            {
                tag: `a.${buttonClassName}`,
                priority: 60,
                getAttrs: (dom) => ({
                    ...buttonFromAttrs((name) => dom.getAttribute(name)),
                    [ButtonAttr.Label]: singleLine(dom.textContent ?? '').trim(),
                }),
            },
        ],
        leafText: buttonLabel,
        toDOM: (node) => ['a', buttonAttrs(node.attrs), node.attrs[ButtonAttr.Label]],
    }));
};
