import type {Node, NodeSpec} from 'prosemirror-model';
import type {ExtensionAuto} from '../../../../core';
import {headingNodeName, YfmHeadingAttr} from './const';
import {getNodeAttrs} from './utils';

const DEFAULT_PLACEHOLDER = (node: Node) => 'Heading ' + node.attrs[YfmHeadingAttr.Level];

export {YfmHeadingAttr} from './const';

export type YfmHeadingSpecsOptions = {
    headingPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

/** YfmHeading extension needs markdown-it-attrs plugin */
export const YfmHeadingSpecs: ExtensionAuto<YfmHeadingSpecsOptions> = (builder, opts) => {
    const {headingPlaceholder} = opts ?? {};

    builder.addNode(headingNodeName, () => ({
        spec: {
            attrs: {
                [YfmHeadingAttr.Id]: {default: ''},
                [YfmHeadingAttr.Level]: {default: 1},
            },
            content: '(text | inline)*',
            group: 'block',
            defining: true,
            selectable: true,
            parseDOM: [
                {tag: 'h1', getAttrs: getNodeAttrs(1)},
                {tag: 'h2', getAttrs: getNodeAttrs(2)},
                {tag: 'h3', getAttrs: getNodeAttrs(3)},
                {tag: 'h4', getAttrs: getNodeAttrs(4)},
                {tag: 'h5', getAttrs: getNodeAttrs(5)},
                {tag: 'h6', getAttrs: getNodeAttrs(6)},
            ],
            toDOM(node) {
                const id = node.attrs[YfmHeadingAttr.Id];
                return [
                    'h' + node.attrs[YfmHeadingAttr.Level],
                    id ? {id} : {},
                    0,
                    // [
                    //     'a',
                    //     {
                    //         href: `#${node.attrs[YfmHeadingAttr.Id]}`,
                    //         class: 'yfm-anchor',
                    //         'aria-hidden': 'true',
                    //         contenteditable: 'false',
                    //     },
                    // ],
                    // ['span', 0],
                ];
            },
            placeholder: {
                content: headingPlaceholder ?? DEFAULT_PLACEHOLDER,
                alwaysVisible: true,
            },
        },
        fromYfm: {
            tokenSpec: {
                name: headingNodeName,
                type: 'block',
                getAttrs: (token) => {
                    if (token.type.endsWith('_close')) return {};

                    const attrs = Object.fromEntries(token.attrs || []);
                    // if (!attrs[YfmHeadingAttr.Id]) {
                    //     // calculate id if it was not specified
                    //     // tokens[index + 1] is child inline token
                    //     attrs[YfmHeadingAttr.Id] = slugify(tokens[index + 1].content);
                    // }

                    // attrs have id only if it explicitly specified manually
                    return {
                        [YfmHeadingAttr.Level]: Number(token.tag.slice(1)),
                        ...attrs,
                    };
                },
            },
        },
        toYfm: (state, node) => {
            state.write(state.repeat('#', node.attrs[YfmHeadingAttr.Level]) + ' ');
            state.renderInline(node);

            const anchor = node.attrs[YfmHeadingAttr.Id];

            if (anchor /*&& anchor !== node.firstChild?.textContent*/) {
                state.write(` {#${anchor}}`);
            }

            state.closeBlock(node);
        },
    }));
};
