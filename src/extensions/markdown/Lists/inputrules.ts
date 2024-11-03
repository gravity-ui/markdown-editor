import type {NodeType} from 'prosemirror-model';

import type {ExtensionWithOptions} from '../../../core';
import {wrappingInputRule} from '../../../utils/inputrules';

import {ListsAttr} from './ListsSpecs';
import {blType, olType} from './utils';

export type ListsInputRulesOptions = {
    bulletListInputRule?: false | BulletListInputRuleConfig;
};

export const ListsInputRulesExtension: ExtensionWithOptions<ListsInputRulesOptions> = (
    builder,
    options,
) => {
    builder.addInputRules(({schema}) => {
        const rules = [orderedListRule(olType(schema))];
        if (options.bulletListInputRule !== false) {
            const blRule = bulletListRule(blType(schema), options.bulletListInputRule);
            if (blRule) rules.push(blRule);
        }
        return {rules};
    });
};

/**
 * Given a list node type, returns an input rule that turns a number
 * followed by a dot at the start of a textblock into an ordered list.
 */
export function orderedListRule(nodeType: NodeType) {
    return wrappingInputRule(
        /^(\d+)([.)])\s$/,
        nodeType,
        (match) => ({[ListsAttr.Order]: Number(match[1])}),
        (match, node) => node.childCount + node.attrs[ListsAttr.Order] === Number(match[1]),
    );
}

type BulletListInputRuleConfig = {
    /** @default true */
    dash?: boolean;
    /** @default true */
    plus?: boolean;
    /** @default true */
    asterisk?: boolean;
};

/**
 * Given a list node type, returns an input rule that turns a bullet
 * (dash, plus, or asterisk) at the start of a textblock into a
 * bullet list.
 */
export function bulletListRule(nodeType: NodeType, config?: BulletListInputRuleConfig) {
    const bullets: string[] = [];
    if (config?.dash !== false) bullets.push('-');
    if (config?.plus !== false) bullets.push('+');
    if (config?.asterisk !== false) bullets.push('*');
    if (bullets.length === 0) return null;

    const regexp = new RegExp(`^\\s*([${bullets.join('')}])\\s$`); // same as /^\s*([-+*])\s$/
    return wrappingInputRule(regexp, nodeType, (match) => ({[ListsAttr.Bullet]: match[1]}));
}
