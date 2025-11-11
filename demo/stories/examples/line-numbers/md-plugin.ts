import type {PluginSimple} from 'markdown-it';
import type {RuleCore} from 'markdown-it/lib/parser_core';

const RULE_NAME = 'line_numbers';

const TOKENS: readonly string[] = ['paragraph_open', 'heading_open'];

export const lineNumbersPlugin: PluginSimple = (md) => {
    const rule: RuleCore = ({tokens}) => {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.map && TOKENS.includes(token.type)) {
                const line = token.map[0];
                token.attrPush(['data-line', String(line)]);
            }
        }
    };

    md.core.ruler.push(RULE_NAME, rule);
};
