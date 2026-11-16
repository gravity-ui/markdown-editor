// @vitest-environment jsdom
import {createElement} from 'react';

import {Schema} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it, vi} from 'vitest';

import type {WysiwygGptHost} from '../../../host';

import {runGpt} from './commands';
import {gptWidgetPlugin} from './plugin';
import {pluginKey} from './plugin-key';

const schema = new Schema({
    nodes: {doc: {content: 'paragraph+'}, paragraph: {content: 'text*'}, text: {}},
});
const host: WysiwygGptHost = {
    getRenderer: () => ({createItem: () => ({remove: vi.fn(), rerender: vi.fn()})}),
    parser: {
        parse: (text) =>
            schema.node('doc', null, [schema.node('paragraph', null, schema.text(text))]),
    },
    serializer: {serialize: (doc) => doc.textContent},
};

describe('GPT WYSIWYG state', () => {
    it('should preserve the original selected range without mutating options', () => {
        const options = Object.freeze({
            ...host,
            answerRender: () => createElement('div'),
            onCustomPromptApply: async () => undefined,
        });
        let state = EditorState.create({
            schema,
            doc: host.parser.parse('original'),
            plugins: [gptWidgetPlugin(options)],
        });
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1, 5)));
        runGpt(state, (tr) => {
            state = state.apply(tr);
        });
        expect(
            pluginKey
                .getState(state)
                ?.find()
                .map(({from, to}) => ({from, to})),
        ).toEqual([{from: 1, to: 5}]);
        state = state.apply(state.tr.insertText('changed', 1));
        expect(pluginKey.getState(state)?.find()).toEqual([]);
    });

    it('should close on selection changes and keep empty-selection state local to each editor', () => {
        const options = {
            ...host,
            answerRender: () => createElement('div'),
            onCustomPromptApply: async () => undefined,
        };
        const second = EditorState.create({
            schema,
            doc: host.parser.parse('second'),
            plugins: [gptWidgetPlugin(options)],
        });
        let first = EditorState.create({
            schema,
            doc: host.parser.parse('first'),
            plugins: [gptWidgetPlugin(options)],
        });
        runGpt(first, (tr) => {
            first = first.apply(tr);
        });
        expect(pluginKey.getState(first)?.find()).toHaveLength(1);
        expect(pluginKey.getState(second)?.find()).toHaveLength(0);
        first = first.apply(first.tr.setSelection(TextSelection.create(first.doc, 2)));
        expect(pluginKey.getState(first)?.find()).toEqual([]);
    });
});
