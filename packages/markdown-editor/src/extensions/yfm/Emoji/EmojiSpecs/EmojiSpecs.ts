import type {Options} from 'markdown-it-emoji';
import emojiPlugin from 'markdown-it-emoji/bare.js';

import type {ExtensionAuto} from '../../../../core';

import {EmojiConsts, emojiTokenName, markupDataAttribute} from './const';

export {EmojiConsts} from './const';

export type EmojiSpecsOptions = {
    defs?: Record<string, string>;
    shortcuts?: Partial<Record<string, string | string[]>>;
};

const EmojiSpecsExtension: ExtensionAuto<EmojiSpecsOptions> = (builder, opts) => {
    builder.configureMd((md) => md.use<Options>(emojiPlugin, opts));
    builder.addNode(EmojiConsts.NodeName, () => ({
        spec: {
            attrs: {[EmojiConsts.NodeAttrs.Markup]: {}},
            atom: true,
            inline: true,
            content: 'text*',
            group: 'inline',
            selectable: false,
            parseDOM: [
                {
                    tag: `span[${markupDataAttribute}]`,
                    priority: 100,
                    getAttrs: (node) => {
                        if (node instanceof HTMLElement) {
                            const markup = node.getAttribute(markupDataAttribute);
                            if (markup) {
                                return {[EmojiConsts.NodeAttrs.Markup]: markup};
                            }
                        }
                        return false;
                    },
                },
            ],
            toDOM: (node) => {
                const markup = node.attrs[EmojiConsts.NodeAttrs.Markup];
                return ['span', {contentEditable: false, [markupDataAttribute]: markup}, 0];
            },
        },
        fromMd: {
            tokenName: emojiTokenName,
            tokenSpec: {
                name: EmojiConsts.NodeName,
                type: 'block',
                noCloseToken: true,
                getAttrs: (token) => ({
                    [EmojiConsts.NodeAttrs.Markup]: token.markup,
                }),
            },
        },
        toMd: (state, node) => {
            state.text(`:${node.attrs[EmojiConsts.NodeAttrs.Markup]}:`, false);
        },
    }));
};

export const EmojiSpecs = Object.assign(EmojiSpecsExtension, EmojiConsts);
