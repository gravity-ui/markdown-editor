import type {Node, NodeSpec} from 'prosemirror-model';
import {Action, createExtension, ExtensionAuto, Keymap} from '../../../core';
import {HeadingAction, YfmHeadingAttr, heading} from './const';
import {getNodeAttrs, headingRule, hType} from './utils';
import {headingAction} from './actions';
import {resetHeading, toHeading} from './commands';

const DEFAULT_PLACEHOLDER = (node: Node) => 'Heading ' + node.attrs[YfmHeadingAttr.Level];

export {YfmHeadingAttr} from './const';

export type YfmHeadingOptions = {
    h1Key?: string | null;
    h2Key?: string | null;
    h3Key?: string | null;
    h4Key?: string | null;
    h5Key?: string | null;
    h6Key?: string | null;
    headingPlaceholder?: NonNullable<NodeSpec['placeholder']>['content'];
};

/** YfmHeading extension needs markdown-it-attrs plugin */
export const YfmHeading: ExtensionAuto<YfmHeadingOptions> = (builder, opts) => {
    const {headingPlaceholder} = opts ?? {};

    builder.addNode(heading, () => ({
        spec: {
            attrs: {
                [YfmHeadingAttr.Id]: {default: ''},
                [YfmHeadingAttr.Level]: {default: 1},
            },
            content: '(text | inline)*',
            group: 'block',
            defining: true,
            selectable: false,
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
                name: heading,
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

    builder
        .addKeymap(() => {
            const {h1Key, h2Key, h3Key, h4Key, h5Key, h6Key} = opts ?? {};
            const bindings: Keymap = {Backspace: resetHeading};
            if (h1Key) bindings[h1Key] = toHeading(1);
            if (h2Key) bindings[h2Key] = toHeading(2);
            if (h3Key) bindings[h3Key] = toHeading(3);
            if (h4Key) bindings[h4Key] = toHeading(4);
            if (h5Key) bindings[h5Key] = toHeading(5);
            if (h6Key) bindings[h6Key] = toHeading(6);
            return bindings;
        })
        .addInputRules(({schema}) => ({rules: [headingRule(hType(schema), 6)]}));

    builder
        .addAction(HeadingAction.ToH1, () => headingAction(1))
        .addAction(HeadingAction.ToH2, () => headingAction(2))
        .addAction(HeadingAction.ToH3, () => headingAction(3))
        .addAction(HeadingAction.ToH4, () => headingAction(4))
        .addAction(HeadingAction.ToH5, () => headingAction(5))
        .addAction(HeadingAction.ToH6, () => headingAction(6));
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const YfmHeadingE = createExtension<YfmHeadingOptions>((b, o = {}) => b.use(YfmHeading, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            [HeadingAction.ToH1]: Action;
            [HeadingAction.ToH2]: Action;
            [HeadingAction.ToH3]: Action;
            [HeadingAction.ToH4]: Action;
            [HeadingAction.ToH5]: Action;
            [HeadingAction.ToH6]: Action;
        }
    }
}
