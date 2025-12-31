import type MarkdownIt from 'markdown-it';

const prefix = 'r-';

// prefix is added to token types of radio tabs tokens in order to use other nodes in prosemirror
export const tabsPostPlugin: MarkdownIt.PluginSimple = (md) => {
    md.core.ruler.push('me_tabs_after', (state) => {
        const stack: {vertical?: boolean}[] = [];

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
                        token.type = prefix + token.type;
                    }
                    break;
                }
                case 'tab_close': {
                    const item = stack.at(-1);
                    if (item?.vertical) {
                        token.type = prefix + token.type;
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
            }
        }
    });
};
