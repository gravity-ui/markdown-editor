import term from '@diplodoc/transform/lib/plugins/term';
import MarkdownIt from 'markdown-it';
import {DOMParser, DOMSerializer} from 'prosemirror-model';
import {EditorState, TextSelection} from 'prosemirror-state';
import {describe, expect, it} from 'vitest';

import {applyCommand} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {CommonMarkSpecsPreset} from '../../../presets/commonmark-specs';
import {FullSpecsPreset} from '../../../presets/full-specs';

import {FootnoteSpecs, footnoteType} from './FootnoteSpecs';
import {cancelFootnote, insertFootnote, updateFootnote} from './commands';
import {footnoteDefinitionPlugin, footnoteDefinitions} from './definitions';

const deps = new ExtensionsManager({
    extensions: (builder) => builder.use(CommonMarkSpecsPreset, {}).use(FootnoteSpecs),
}).buildDeps();
const {markupParser: parser, serializer, schema} = deps;
const source = 'Before[*](*note)after\n\n[*note]: **Bold** and [link](https://example.com)';

describe('Footnote', () => {
    it.each([
        source,
        '[selected phrase](*note)\n\n[*note]: Source',
        '[*](*note) and [again](*note)\n\n[*note]: Shared',
        '[a \\] bracket](*note)\n\n[*note]: Text',
        '[**literal**](*note)\n\n[*note]: Text',
        '**before [*](*note) after**\n\n[*note]: Text',
        '[*unused]: Unused',
        '[*](*note)\n\n[*note]: First\n\n[*note]: Duplicate',
        '[*](*note)\n\n[*note]: First\n[*other]: Other',
        '[*](*note)\n\n[*note]: First line\nSecond line',
        '[*](*note)\n\n[*note]:    Extra spaces',
    ])('should preserve native term syntax: %s', (markup) => {
        const doc = parser.parse(markup);
        expect(serializer.serialize(doc)).toBe(markup);
        expect(parser.parse(serializer.serialize(doc)).eq(doc)).toBe(true);
    });

    it('should parse a reference without consuming surrounding text', () => {
        const paragraph = parser.parse(source).firstChild!;
        expect(paragraph.child(1).type).toBe(footnoteType(schema));
        expect(paragraph.child(1).attrs.key).toBe('note');
        expect(paragraph.child(1).attrs.label).toBe('*');
        expect(paragraph.lastChild!.text).toBe('after');
    });

    it('should preserve missing and empty definitions as ordinary text', () => {
        for (const markup of ['[label](*missing)', '[*empty]:']) {
            const doc = parser.parse(markup);
            expect(doc.firstChild!.childCount).toBe(1);
            expect(doc.firstChild!.firstChild!.isText).toBe(true);
            expect(doc.textContent).toBe(markup);
        }
    });

    it('should preserve references and definitions when copying a document through DOM', () => {
        const doc = parser.parse(source);
        const host = document.createElement('div');
        host.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(host).eq(doc)).toBe(true);
    });

    it('should include native terms in the full specs preset', () => {
        const full = new ExtensionsManager({
            extensions: (builder) => builder.use(FullSpecsPreset, {color: {}}),
        }).buildDeps();
        expect(full.markupParser.parse(source).firstChild!.child(1).type.name).toBe('footnote');
    });

    it('should insert a star and restore an empty selection on cancel', () => {
        let state = EditorState.create({doc: parser.parse('text')});
        const {res, tr} = applyCommand(state, insertFootnote());
        expect(res).toBe(true);
        expect(tr.selection.toJSON()).toEqual({type: 'node', anchor: 1});
        expect(tr.doc.firstChild!.firstChild!.attrs.label).toBe('*');
        expect(serializer.serialize(tr.doc)).toBe('text');
        state = state.apply(tr);
        const cancelled = applyCommand(state, cancelFootnote(1));
        expect(cancelled.res).toBe(true);
        expect(serializer.serialize(cancelled.tr.doc)).toBe('text');
    });

    it('should retain selected text and its uniform formatting', () => {
        let state = EditorState.create({doc: parser.parse('Before **source** after')});
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 8, 14)));
        state = state.apply(applyCommand(state, insertFootnote()).tr);
        expect(state.doc.firstChild!.child(1).attrs.label).toBe('source');
        const saved = applyCommand(state, updateFootnote(8, 'source', 'Explanation', deps));
        expect(saved.res).toBe(true);
        expect(serializer.serialize(saved.tr.doc)).toBe(
            'Before **[source](*footnote-1)** after\n\n[*footnote-1]: Explanation',
        );
        const cancelled = applyCommand(state, cancelFootnote(8));
        expect(serializer.serialize(cancelled.tr.doc)).toBe('Before **source** after');
    });

    it('should reject mixed formatting, cross-block selections and code', () => {
        let state = EditorState.create({doc: parser.parse('one **two**\n\nthree')});
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1, 8)));
        expect(insertFootnote()(state)).toBe(false);
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1, 12)));
        expect(insertFootnote()(state)).toBe(false);
        expect(insertFootnote()(EditorState.create({doc: parser.parse('```\ncode\n```')}))).toBe(
            false,
        );
    });

    it('should save a new definition with a unique key', () => {
        let state = EditorState.create({doc: parser.parse('[*footnote-1]: Existing')});
        state = state.apply(
            state.tr.insert(0, schema.nodes.paragraph.create(null, schema.text('text'))),
        );
        state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 1)));
        state = state.apply(applyCommand(state, insertFootnote()).tr);
        expect(state.doc.firstChild!.firstChild!.attrs.key).toBe('footnote-2');
        const {res, tr} = applyCommand(state, updateFootnote(1, '*', 'New note', deps));
        expect(res).toBe(true);
        expect(footnoteDefinitions(tr.doc).get('footnote-2')?.node.attrs.content).toBe('New note');
        expect(parser.parse(serializer.serialize(tr.doc)).eq(tr.doc)).toBe(true);
    });

    it('should update shared definitions without duplicating or renumbering references', () => {
        const plugin = footnoteDefinitionPlugin();
        let state = EditorState.create({
            doc: parser.parse('[first](*note) [second](*note)\n\n[*note]: Old'),
            plugins: [plugin],
        });
        state = state.apply(applyCommand(state, updateFootnote(1, 'First', '**New**', deps)).tr);
        expect(
            plugin
                .getState(state)!
                .find()
                .map((deco) => deco.spec.footnoteContent),
        ).toEqual(['**New**', '**New**']);
        expect(serializer.serialize(state.doc)).toBe(
            '[First](*note) [second](*note)\n\n[*note]: **New**',
        );
        expect(parser.parse(serializer.serialize(state.doc)).eq(state.doc)).toBe(true);
    });

    it('should reject empty content and definitions that consume other blocks', () => {
        const state = EditorState.create({doc: parser.parse(source)});
        for (const content of [
            '',
            '   ',
            'Text\n\nAnother paragraph',
            'Text\n[*other]: Definition',
        ]) {
            expect(updateFootnote(7, '*', content, deps)(state)).toBe(false);
        }
        expect(updateFootnote(7, '', 'Text', deps)(state)).toBe(false);
        expect(updateFootnote(1, '*', 'Text', deps)(state)).toBe(false);
    });

    it('should escape edited labels while retaining ordinary links and native preview formatting', () => {
        const state = EditorState.create({doc: parser.parse(source)});
        const saved = applyCommand(
            state,
            updateFootnote(7, 'a [bracket] \\ path', '**Text**', deps),
        );
        expect(saved.res).toBe(true);
        const md = new MarkdownIt({html: false}).use(term, {});
        const html = md.render(serializer.serialize(saved.tr.doc));
        expect(html).toContain('class="yfm yfm-term_title"');
        expect(html).toContain('a [bracket] \\ path');
        expect(html).toContain('<strong>Text</strong>');
        expect(md.render(source)).toContain('href="https://example.com"');
        expect(
            md.render('[*](*n)\n\n[*n]: <script>text</script> [link](javascript:alert(1))'),
        ).not.toContain('<script>');
    });
});
