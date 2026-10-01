import type MarkdownIt from 'markdown-it';
import type StateCore from 'markdown-it/lib/rules_core/state_core';
import type Token from 'markdown-it/lib/token';

export type SlotMatch = (group: readonly Token[]) => boolean;

export type SlotRule = {
    /** Slot name; with `wrap` it also prefixes the `<slot>_open` and `<slot>_close` token types */
    slot: string;
    /** Pair of block tokens around the routed groups */
    wrap?: {tag?: string; class?: string};
} & ({match: SlotMatch; fallback?: never} | {match?: never; fallback: true});

export type BlockContentSlotsParams = {
    /** Routed body: tokens between `<bodyToken>_open` and `<bodyToken>_close` */
    bodyToken: string;
    slots: SlotRule[];
};

export const byType =
    (...types: string[]): SlotMatch =>
    (group) =>
        types.includes(group[0].type);

export function blockContentSlots(md: MarkdownIt, {bodyToken, slots}: BlockContentSlotsParams) {
    validate(slots);

    const openType = `${bodyToken}_open`;
    const closeType = `${bodyToken}_close`;

    md.core.ruler.push(`${bodyToken}_slots`, (state) => {
        const {tokens} = state;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type !== openType) continue;
            const close = groupEnd(tokens, i);
            if (tokens[close].type !== closeType) continue;
            const routed = route(state, tokens.slice(i + 1, close), slots);
            tokens.splice(i + 1, close - i - 1, ...routed);
        }
    });
}

function route(state: StateCore, body: readonly Token[], slots: SlotRule[]): Token[] {
    const buckets: Token[][] = slots.map(() => []);
    const fallback = slots.findIndex((slot) => slot.fallback);

    for (let i = 0; i < body.length; ) {
        const end = groupEnd(body, i);
        const group = body.slice(i, end + 1);
        i = end + 1;

        const matched = slots.findIndex(({match}) => match?.(group));
        const index = matched < 0 ? fallback : matched;
        if (index < 0) continue;
        for (const token of group) buckets[index].push(token);
    }

    const bodyLevel = body[0]?.level ?? 0;
    const routed: Token[] = [];
    slots.forEach(({slot, wrap}, index) => {
        const bucket = buckets[index];
        if (!bucket.length) return;

        if (!wrap) {
            for (const token of bucket) routed.push(token);
            return;
        }

        const tag = wrap.tag ?? 'div';
        const open = new state.Token(`${slot}_open`, tag, 1);
        open.block = true;
        open.level = bodyLevel;
        open.map = lineSpan(bucket);
        if (wrap.class) open.attrSet('class', wrap.class);

        const close = new state.Token(`${slot}_close`, tag, -1);
        close.block = true;
        close.level = bodyLevel;

        routed.push(open);
        for (const token of bucket) {
            token.level += 1;
            routed.push(token);
        }
        routed.push(close);
    });

    return routed;
}

/** Index of the token closing the group opened at `start`; `start` itself for a self-closing one */
function groupEnd(tokens: readonly Token[], start: number): number {
    let end = start;
    for (let depth = tokens[start].nesting; depth > 0 && end + 1 < tokens.length; ) {
        depth += tokens[++end].nesting;
    }
    return end;
}

function lineSpan(tokens: readonly Token[]): [number, number] | null {
    let span: [number, number] | null = null;
    for (const {map} of tokens) {
        if (!map) continue;
        if (span) span[1] = map[1];
        else span = [map[0], map[1]];
    }
    return span;
}

function validate(slots: SlotRule[]): void {
    if (!slots.length) throw new Error('blockContentSlots: at least one slot is required');

    const names = new Set<string>();
    let fallbacks = 0;

    for (const {slot, match, fallback} of slots) {
        if (names.has(slot)) throw new Error(`blockContentSlots: duplicate slot "${slot}"`);
        names.add(slot);

        if (Boolean(match) === Boolean(fallback)) {
            throw new Error(`blockContentSlots: slot "${slot}" needs either match or fallback`);
        }
        if (fallback && ++fallbacks > 1) {
            throw new Error('blockContentSlots: only one fallback slot is allowed');
        }
    }
}
