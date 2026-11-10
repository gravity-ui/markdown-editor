import type {Completion} from '@codemirror/autocomplete';
import {syntaxTree} from '@codemirror/language';

import type {LanguageData} from '../yfm';

const ignoredNodes: ReadonlySet<string> = new Set([
    'InlineCode',
    'FencedCode',
    'CodeBlock',
    'HTMLBlock',
    'HTMLTag',
]);

export function emojiAutocomplete(defs: Record<string, string>): LanguageData {
    const options: Completion[] = Object.entries(defs).map(([name, symbol]) => ({
        label: `:${name}:`,
        detail: symbol,
        type: 'text',
    }));

    return {
        autocomplete: (context) => {
            if (context.state.readOnly || !context.state.selection.main.empty) return null;

            const syntaxNode = syntaxTree(context.state).resolve(context.pos, -1);
            for (let node: typeof syntaxNode | null = syntaxNode; node; node = node.parent) {
                if (ignoredNodes.has(node.name)) return null;
            }

            const token = context.matchBefore(context.explicit ? /:[\w+-]*$/ : /(?:^|\s):[\w+-]*$/);
            if (!token) return null;

            return {
                from: token.from + token.text.indexOf(':'),
                options,
                validFor: /^:[\w+-]*$/,
            };
        },
    };
}
