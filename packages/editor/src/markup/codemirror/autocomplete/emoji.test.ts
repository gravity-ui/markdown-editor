import {CompletionContext} from '@codemirror/autocomplete';
import {markdown} from '@codemirror/lang-markdown';
import {EditorState} from '@codemirror/state';
import {describe, expect, it} from 'vitest';

import {emojiAutocomplete} from './emoji';

const {autocomplete} = emojiAutocomplete({smile: '😄', '+1': '👍'});

function complete(doc: string, explicit = false, pos = doc.length) {
    const state = EditorState.create({
        doc,
        selection: {anchor: pos},
        extensions: [markdown()],
    });
    return autocomplete(new CompletionContext(state, pos, explicit));
}

describe('markup emoji completion', () => {
    it.each(['Hello :smi', 'Hello\n:+1'])(
        'should suggest emoji after a colon in %j',
        async (doc) => {
            const result = await complete(doc);

            expect(result?.from).toBe(doc.lastIndexOf(':'));
            expect(result?.options).toEqual([
                {label: ':smile:', detail: '😄', type: 'text'},
                {label: ':+1:', detail: '👍', type: 'text'},
            ]);
        },
    );

    it.each([':smile:', 'word:smi'])(
        'should leave %j without automatic emoji suggestions',
        async (doc) => {
            expect(await complete(doc)).toBeNull();
        },
    );

    it('should replace an existing emoji prefix when opened explicitly', async () => {
        expect((await complete('Hello :smi', true))?.from).toBe(6);
    });

    it.each(['`:smi`', '```js\n:smi\n```', '<div>\n:smi\n</div>'])(
        'should suppress emoji suggestions inside code or HTML in %j',
        async (doc) => {
            const pos = doc.indexOf(':smi') + 4;

            expect(await complete(doc, false, pos)).toBeNull();
            expect(await complete(doc, true, pos)).toBeNull();
        },
    );

    it('should suppress emoji suggestions in a read-only editor', async () => {
        const state = EditorState.create({
            doc: ':',
            selection: {anchor: 1},
            extensions: [EditorState.readOnly.of(true)],
        });

        expect(await autocomplete(new CompletionContext(state, 1, true))).toBeNull();
    });

    it('should preserve a nonempty selection', async () => {
        const state = EditorState.create({doc: ':smi', selection: {anchor: 0, head: 4}});

        expect(await autocomplete(new CompletionContext(state, 4, true))).toBeNull();
    });
});
