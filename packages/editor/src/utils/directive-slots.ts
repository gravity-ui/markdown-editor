import {type ContainerDirectiveParams, tokenizeBlockContent} from '@diplodoc/directive';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';
import type Token from 'markdown-it/lib/token';

export type SlotScheme = Record<string, readonly string[]>;

function* topLevel(tokens: Token[]): Generator<Token[]> {
    for (let i = 0; i < tokens.length; i++) {
        let end = i;
        for (let depth = tokens[i].nesting; depth > 0; ) {
            depth += tokens[++end].nesting;
        }
        yield tokens.slice(i, end + 1);
        i = end;
    }
}

export const slotsTokenizer =
    (scheme: SlotScheme, limits: Readonly<Record<string, number>> = {}) =>
    (state: StateBlock, content: NonNullable<ContainerDirectiveParams['content']>) => {
        const start = state.tokens.length;
        tokenizeBlockContent(state, content);
        const groups = [...topLevel(state.tokens.splice(start))];

        for (const [slot, allowed] of Object.entries(scheme)) {
            state.push(`${slot}_open`, 'div', 1).attrSet('class', slot);
            let count = 0;
            for (const group of groups) {
                if (allowed.includes(group[0].type) && count < (limits[slot] ?? Infinity)) {
                    state.tokens.push(...group);
                    count++;
                }
            }
            state.push(`${slot}_close`, 'div', -1);
        }
    };
