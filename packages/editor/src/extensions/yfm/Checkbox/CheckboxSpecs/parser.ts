import checkboxPlugin from '@diplodoc/transform/lib/plugins/checkbox/index.js';
import type Token from 'markdown-it/lib/token';

import type {ExtensionAuto, ParserToken} from '#core';

import {
    CHECKBOX_CLOSE_TOKEN,
    CHECKBOX_OPEN_TOKEN,
    CheckboxAttr,
    CheckboxNode,
    b,
    idPrefix,
} from './const';

const getCheckboxAttrs: ParserToken['getAttrs'] = (token, tokens, index) => {
    const tight = checkboxIsTight(tokens, index);
    const attrs = token.attrs ? Object.fromEntries(token.attrs) : {};

    return {...attrs, [CheckboxAttr.Tight]: tight};
};

const getAttrs: ParserToken['getAttrs'] = (tok) => (tok.attrs ? Object.fromEntries(tok.attrs) : {});

const parserTokens: Record<CheckboxNode, ParserToken> = {
    [CheckboxNode.Checkbox]: {
        name: CheckboxNode.Checkbox,
        type: 'block',
        getAttrs: getCheckboxAttrs,
    },

    [CheckboxNode.Input]: {name: CheckboxNode.Input, type: 'node', getAttrs},

    [CheckboxNode.Label]: {name: CheckboxNode.Label, type: 'block', getAttrs},
};

function checkboxIsTight(tokens: Token[], index: number): boolean | null {
    let closeTokenEndLine: number | undefined;
    let nextOpenTokenStartLine: number | undefined;

    for (let i = index + 1; i < tokens.length; i++) {
        if (tokens[i].type === CHECKBOX_CLOSE_TOKEN) {
            closeTokenEndLine = tokens[i].map?.[1];

            if (tokens[i + 1]?.type === CHECKBOX_OPEN_TOKEN) {
                nextOpenTokenStartLine = tokens[i + 1].map?.[0];
            }

            break;
        }
    }

    if (!Number.isFinite(closeTokenEndLine) || !Number.isFinite(nextOpenTokenStartLine))
        return null;

    return closeTokenEndLine === nextOpenTokenStartLine;
}

export const CheckboxParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(checkboxPlugin, {idPrefix, divClass: b(null, 'checkbox')}))
        .addMarkdownTokenParserSpec('checkbox', () => parserTokens[CheckboxNode.Checkbox])
        .addMarkdownTokenParserSpec('checkbox_input', () => parserTokens[CheckboxNode.Input])
        .addMarkdownTokenParserSpec('checkbox_label', () => parserTokens[CheckboxNode.Label]);
};
