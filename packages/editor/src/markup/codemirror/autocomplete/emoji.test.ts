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
    it.each([
        ['Hello :smi', false],
        ['Hello\n:+1', false],
        ['word:smi', true],
    ])('should suggest emoji from the colon in %j (explicit: %s)', async (doc, explicit) => {
        const result = await complete(doc, explicit);

        expect(result?.from).toBe(doc.lastIndexOf(':'));
        expect(result?.options).toEqual([
            {label: ':smile:', detail: '😄', type: 'text'},
            {label: ':+1:', detail: '👍', type: 'text'},
        ]);
    });

    it.each([':smile:', 'word:smi'])(
        'should skip automatic emoji suggestions in %j',
        async (doc) => {
            expect(await complete(doc)).toBeNull();
        },
    );

    it.each(['`:smi`', '```js\n:smi\n```', '<div>\n:smi\n</div>'])(
        'should skip emoji suggestions inside code or HTML in %j',
        async (doc) => {
            const pos = doc.indexOf(':smi') + 4;

            expect(await complete(doc, false, pos)).toBeNull();
            expect(await complete(doc, true, pos)).toBeNull();
        },
    );

    it.each([
        ['a read-only editor', {doc: ':', extensions: EditorState.readOnly.of(true)}],
        ['a nonempty selection', {doc: ':smi', selection: {anchor: 0, head: 4}}],
    ])('should skip emoji suggestions in %s', async (_name, config) => {
        const state = EditorState.create(config);

        expect(await autocomplete(new CompletionContext(state, state.doc.length, true))).toBeNull();
    });
});
