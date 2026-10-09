import MarkdownIt from 'markdown-it';
import {DOMParser, DOMSerializer} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {applyCommand} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import footnote from '../../../markdown-it/footnote';
import {CommonMarkSpecsPreset} from '../../../presets/commonmark-specs';
import {FullSpecsPreset} from '../../../presets/full-specs';

import {FootnoteSpecs, footnoteType} from './FootnoteSpecs';
import {insertFootnote, updateFootnote} from './commands';
import {footnoteNumbering} from './numbering';

const deps = new ExtensionsManager({
    extensions: (builder) => builder.use(CommonMarkSpecsPreset, {}).use(FootnoteSpecs),
}).buildDeps();
const {markupParser: parser, serializer, schema} = deps;

describe('Footnote', () => {
    it.each([
        'Rate:footnote[Source].',
        ':footnote[]',
        ':footnote[**Bold**, _italic_, `code`, and [link](https://example.com)]',
        ':footnote[Source]{marker="*"}',
        ':footnote[Source]{marker=\'†\' unknown="value"}',
        ':footnote[escaped \\] bracket]{marker="1" data-extra="kept"}',
        '**before :footnote[**inside**] after**',
        'A:footnote[first] B:footnote[second]',
    ])('should preserve directive syntax: %s', (markup) => {
        const doc = parser.parse(markup);
        expect(serializer.serialize(doc)).toBe(markup);
        expect(parser.parse(serializer.serialize(doc)).eq(doc)).toBe(true);
    });

    it('should parse inline content without consuming surrounding text', () => {
        const doc = parser.parse('Before:footnote[**note**]{marker="*"}after');
        const note = doc.firstChild!.child(1);
        expect(note.type).toBe(footnoteType(schema));
        expect(note.attrs).toEqual({
            content: '**note**',
            prefix: ':footnote[',
            suffix: ']{marker="*"}',
            marker: '*',
        });
        expect(doc.firstChild!.lastChild!.text).toBe('after');
    });

    it('should leave unregistered directives and missing content as text', () => {
        const doc = parser.parse(':unknown[text] :footnote :footnote(id)');
        expect(doc.firstChild!.childCount).toBe(1);
        expect(doc.textContent).toBe(':unknown[text] :footnote :footnote(id)');
    });

    it('should preserve footnotes when copying the document through DOM', () => {
        const doc = parser.parse(':footnote[**text**]{unknown="kept"}');
        const host = document.createElement('div');
        host.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(host).eq(doc)).toBe(true);
    });

    it('should include footnotes in the full specs preset', () => {
        const full = new ExtensionsManager({
            extensions: (builder) => builder.use(FullSpecsPreset, {color: {}}),
        }).buildDeps();
        expect(full.markupParser.parse(':footnote[note]').firstChild!.firstChild!.type.name).toBe(
            'footnote',
        );
    });

    it('should insert an empty footnote at the cursor', () => {
        const state = EditorState.create({doc: parser.parse('text')});
        const {res, tr} = applyCommand(state, insertFootnote(deps));
        expect(res).toBe(true);
        expect(serializer.serialize(tr.doc)).toBe(':footnote[]text');
        expect(tr.selection.toJSON()).toEqual({type: 'node', anchor: 1});
        expect(insertFootnote(deps)(state)).toBe(true);
    });

    it('should convert formatted inline selection into a footnote', () => {
        let state = EditorState.create({doc: parser.parse('Before **source** after')});
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 8, 14)));
        const {res, tr} = applyCommand(state, insertFootnote(deps));
        expect(res).toBe(true);
        expect(serializer.serialize(tr.doc)).toBe('Before :footnote[**source**] after');
    });

    it('should reject selections across blocks and inside code blocks', () => {
        const state = EditorState.create({doc: parser.parse('one\n\ntwo')});
        const selected = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1, 7)));
        expect(insertFootnote(deps)(selected)).toBe(false);
        const code = EditorState.create({doc: parser.parse('```\ncode\n```')});
        expect(insertFootnote(deps)(code)).toBe(false);
    });

    it('should update content and preserve the original parameters', () => {
        const state = EditorState.create({
            doc: parser.parse(':footnote[old]{marker=\'*\' unknown="kept"}'),
        });
        const {res, tr} = applyCommand(state, updateFootnote(1, '**new**', deps));
        expect(res).toBe(true);
        expect(serializer.serialize(tr.doc)).toBe(
            ':footnote[**new**]{marker=\'*\' unknown="kept"}',
        );
    });

    it('should reject updates that break the directive syntax', () => {
        const state = EditorState.create({doc: parser.parse(':footnote[old]')});
        expect(updateFootnote(1, 'unmatched ] bracket', deps)(state)).toBe(false);
        expect(updateFootnote(2, 'text', deps)(state)).toBe(false);
        expect(serializer.serialize(state.doc)).toBe(':footnote[old]');
    });

    it('should renumber automatic markers after insertions and deletions', () => {
        const plugin = footnoteNumbering();
        let state = EditorState.create({
            doc: parser.parse(':footnote[A]:footnote[B]{marker="*"}:footnote[C]'),
            plugins: [plugin],
        });
        const markers = () =>
            plugin
                .getState(state)!
                .find()
                .map((decoration) => decoration.spec.footnoteMarker);
        expect(markers()).toEqual(['1', '*', '2']);
        state = state.apply(state.tr.insert(1, footnoteType(schema).create({content: 'new'})));
        expect(markers()).toEqual(['1', '2', '*', '3']);
        state = state.apply(state.tr.delete(1, 2));
        expect(markers()).toEqual(['1', '*', '2']);
        expect(serializer.serialize(state.doc)).toBe(
            ':footnote[A]:footnote[B]{marker="*"}:footnote[C]',
        );
    });

    it('should number footnotes across headings and nested blocks', () => {
        const plugin = footnoteNumbering();
        const state = EditorState.create({
            doc: parser.parse('# Title:footnote[heading]\n\n> Quote:footnote[quote]'),
            plugins: [plugin],
        });
        expect(
            plugin
                .getState(state)!
                .find()
                .map((decoration) => decoration.spec.footnoteMarker),
        ).toEqual(['1', '2']);
    });

    it('should render inline formatting and restart numbering for each preview', () => {
        const md = new MarkdownIt({html: false}).use(footnote);
        const source =
            ':footnote[**bold** _italic_ `code` [link](https://example.com)]:footnote[text]{marker="*"}:footnote[last]';
        const html = md.render(source);
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<em>italic</em>');
        expect(html).toContain('<code>code</code>');
        expect(html).toContain('<a href="https://example.com">link</a>');
        expect(html).toMatch(/>1<\/sup>.*>\*<\/sup>.*>2<\/sup>/);
        expect(md.render(source)).toBe(html);
    });

    it('should escape custom markers and prevent unsafe links in previews', () => {
        const md = new MarkdownIt({html: false}).use(footnote);
        const html = md.render(
            ':footnote[[link](javascript:alert(1)) <script>alert(1)</script>]{marker="<img>"}',
        );
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('href="javascript:');
        expect(html).toContain('&lt;img&gt;');
    });
});
