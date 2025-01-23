// Все доработки в diplodoc/transform
import type MarkdownIt from 'markdown-it';
import type {PluginWithOptions} from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

// eslint-disable-next-line no-useless-escape
export const pattern = /^\[(X|\s|\_|\-)\]\s((.|\s)*)/i;

export const CheckboxTokenType = {
    Checkbox: 'checkbox',
    CheckboxOpen: 'checkbox_open',
    CheckboxClose: 'checkbox_close',
    CheckboxInput: 'checkbox_input',
    CheckboxLabel: 'checkbox_label',
    CheckboxLabelOpen: 'checkbox_label_open',
    CheckboxLabelClose: 'checkbox_label_close',
} as const;

function matchOpenToken(tokens: Token[], i: number) {
    return (
        tokens[i].type === 'paragraph_open' &&
        tokens[i + 1].type === 'inline' &&
        tokens[i + 1].content.match(pattern)
    );
}

export type CheckboxOptions = {
    idPrefix?: string;
    divClass?: string;
    /** @default true */
    disabled?: boolean;
};

export const checkboxReplace = function (_md: MarkdownIt, opts?: CheckboxOptions): Core.RuleCore {
    let lastId = 0;
    const defaults: Required<CheckboxOptions> = {
        divClass: 'checkbox',
        idPrefix: 'checkbox',
        disabled: true,
    };
    const options = Object.assign(defaults, opts);

    const createTokens = function (state: StateCore, checked: boolean, label: string, i: number) {
        let token: Token;
        const nodes = [];

        /**
         * <div class="checkbox">
         */
        token = new state.Token(CheckboxTokenType.CheckboxOpen, 'div', 1);
        token.block = true;
        token.map = state.tokens[i].map;
        token.attrs = [['class', options.divClass]];
        nodes.push(token);

        /**
         * <input type="checkbox" id="checkbox{n}" checked="true">
         */
        const id = options.idPrefix + lastId;
        lastId += 1;
        token = new state.Token(CheckboxTokenType.CheckboxInput, 'input', 0);
        token.block = true;
        token.map = state.tokens[i].map;
        token.attrs = [
            ['type', 'checkbox'],
            ['id', id],
        ];
        if (options.disabled) {
            token.attrSet('disabled', '');
        }
        if (checked === true) {
            token.attrSet('checked', 'true');
        }
        nodes.push(token);

        /**
         * <label for="checkbox{n}">
         */
        token = new state.Token(CheckboxTokenType.CheckboxLabelOpen, 'label', 1);
        token.attrs = [['for', id]];
        token.block = true;
        nodes.push(token);

        /**
         * content of label tag
         */
        token = state.md.parseInline(label, state.env)[0];
        token.block = true;

        let lastChild: Token;
        if (token.children) {
            token.children = token.children.filter((filterItem, index) => {
                if (index === 0) {
                    lastChild = filterItem;
                    return true;
                }

                const isBreak = !(
                    filterItem.type === 'text' &&
                    filterItem.markup === '&nbsp;' &&
                    lastChild.type === 'softbreak'
                );
                lastChild = filterItem;

                return isBreak;
            });
        }

        nodes.push(token);

        /**
         * closing tags
         */
        token = new state.Token(CheckboxTokenType.CheckboxLabelClose, 'label', -1);
        token.block = true;
        token.map = state.tokens[i].map;
        nodes.push(token);
        token = new state.Token(CheckboxTokenType.CheckboxClose, 'div', -1);
        token.block = true;
        token.map = state.tokens[i].map;
        nodes.push(token);

        return nodes;
    };

    const splitTextToken = function (state: StateCore, matches: RegExpMatchArray, i: number) {
        let checked = false;
        const value = matches[1];
        const label = matches[2];
        if (value === 'X' || value === 'x') {
            checked = true;
        }
        return createTokens(state, checked, label, i);
    };

    return function (state) {
        const blockTokens = state.tokens;
        for (let i = 0; i < blockTokens.length; i++) {
            const match = matchOpenToken(blockTokens, i);
            if (!match) {
                continue;
            }

            blockTokens.splice(i, 3, ...splitTextToken(state, match, i));
        }
    };
};

/**
 * Checkbox plugin for markdown-it.
 * Forked from https://github.com/mcecot/markdown-it-checkbox
 */
const checkbox: PluginWithOptions<CheckboxOptions> = (md, options) => {
    md.core.ruler.push('checkbox', checkboxReplace(md, options));

    return md;
};

export default checkbox;
