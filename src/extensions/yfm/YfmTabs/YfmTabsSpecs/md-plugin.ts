import type MarkdownIt from 'markdown-it';

const prefix = 'r-';

// prefix is added to token types of radio tabs tokens in order to use other nodes in prosemirror
export const tabsPostPlugin: MarkdownIt.PluginSimple = (md) => {
    md.core.ruler.push('me_tabs_after', (state) => {
        const stack: {vertical?: boolean}[] = [];
        const tabCloseIndexes: number[] = [];

        for (const token of state.tokens) {
            switch (token.type) {
                case 'tabs_open': {
                    const vertical = token.attrGet('class')?.includes('yfm-tabs-vertical');
                    stack.push({vertical});
                    if (vertical) token.type = prefix + token.type;

                    break;
                }
                case 'tabs_close': {
                    const item = stack.pop();
                    if (item?.vertical) token.type = prefix + token.type;

                    break;
                }

                case 'tab_open': {
                    const item = stack.at(-1);
                    if (item?.vertical) {
                        // --> TODO: remove after updating to tabs-extension v^3.4.0
                        const isInput = token.tag === 'input';
                        if (isInput) token.type = 'tab-input';
                        // <--
                        token.type = prefix + token.type;
                    }
                    break;
                }
                case 'tab_close': {
                    const item = stack.at(-1);
                    if (item?.vertical) {
                        token.type = prefix + token.type;
                        // --> TODO: remove after updating to tabs-extension v^3.4.0
                        tabCloseIndexes.push(state.tokens.indexOf(token));
                        // <--
                    }
                    break;
                }

                case 'tab-input':
                case 'tab-label_open':
                case 'tab-label_close': {
                    const item = stack.at(-1);
                    if (item?.vertical) {
                        token.type = prefix + token.type;
                    }

                    break;
                }

                // --> TODO: remove after updating to tabs-extension v^3.4.0
                case 'label_open': {
                    const tokenIndex = state.tokens.indexOf(token);
                    const prevToken = tokenIndex > 0 && state.tokens.at(tokenIndex - 1);
                    if (prevToken && prevToken.type === 'r-tab-input') {
                        token.type = prefix + 'tab-' + token.type;
                    }
                    break;
                }
                // <--
            }
        }

        // --> TODO: remove after updating to tabs-extension v^3.4.0
        for (const index of tabCloseIndexes.reverse()) {
            if (index === -1) continue;

            const labelCloseToken = new state.Token(prefix + 'tab-label_close', 'label', -1);
            state.tokens.splice(index, 0, labelCloseToken);
        }
        // <--
    });
};
