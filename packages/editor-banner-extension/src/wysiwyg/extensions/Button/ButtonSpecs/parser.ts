import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    buttonFromAttrs,
    buttonPlugin,
    buttonRowBreakTokenName,
    buttonTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {ButtonAttr, buttonNodeName} from './const';

export const ButtonParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => {
            md.use(buttonPlugin).core.ruler.after('inline', 'button_link_end', (state) => {
                for (const inline of state.tokens) {
                    if (inline.type !== 'inline' || !inline.children) continue;
                    const children: typeof inline.children = [];
                    let open: (typeof children)[number] | null = null;
                    let ended = false;
                    for (const token of inline.children) {
                        if (token.type === 'link_open') {
                            open = token;
                        } else if (token.type === 'link_close') {
                            const skip = ended && !open;
                            open = null;
                            ended = false;
                            if (skip) continue;
                        } else if (token.type === buttonTokenName && open) {
                            if (children.at(-1) === open) children.pop();
                            else children.push(new state.Token('link_close', open.tag, -1));
                            open = null;
                            ended = true;
                        }
                        children.push(token);
                    }
                    inline.children = children;
                }
            });
            return md;
        })
        .addMarkdownTokenParserSpec(buttonTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            getAttrs: (token) => ({
                ...buttonFromAttrs((name) => token.attrGet(name)),
                [ButtonAttr.Label]: token.meta?.label ?? token.content,
            }),
        }))
        .addMarkdownTokenParserSpec(buttonRowBreakTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            ignore: true,
        }));
};
