import {toggleMark} from 'prosemirror-commands';
import {history, redo, undo, undoDepth} from 'prosemirror-history';
import {EditorState, type Plugin, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import type {DecorationSet} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {applyCommand} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BoldSpecs, boldMarkName} from '../../markdown/Bold/BoldSpecs';
import {BreakNodeName, BreaksSpecs} from '../../markdown/Breaks/BreaksSpecs';
import {CodeSpecs, codeMarkName} from '../../markdown/Code/CodeSpecs';
import {ItalicSpecs, italicMarkName} from '../../markdown/Italic/ItalicSpecs';
import {LinkSpecs, linkMarkName} from '../../markdown/Link/LinkSpecs';

import {SpoilerSpecs, spoilerMarkName} from './SpoilerSpecs';
import {findSelectedSpoilers, spoilerEditingPlugin} from './plugins/editing';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BreaksSpecs, {})
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(CodeSpecs)
            .use(LinkSpecs)
            .use(SpoilerSpecs),
}).buildDeps();

const {doc, p, hb, s, b, i, c, a} = builders<'doc' | 'p' | 'hb', 's' | 'b' | 'i' | 'c' | 'a'>(
    schema,
    {
        doc: {nodeType: BaseNode.Doc},
        p: {nodeType: BaseNode.Paragraph},
        hb: {nodeType: BreakNodeName.HardBreak},
        s: {markType: spoilerMarkName},
        b: {markType: boldMarkName},
        i: {markType: italicMarkName},
        c: {markType: codeMarkName},
        a: {markType: linkMarkName},
    },
);

const {same, parse, serialize} = createMarkupChecker({parser, serializer});

const spoilerType = schema.marks[spoilerMarkName];

function createState(
    content: ReturnType<typeof doc>,
    from: number,
    to = from,
    plugins: Plugin[] = [],
) {
    const state = EditorState.create({doc: content, plugins: [history(), ...plugins]});
    return state.apply(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
}

describe('Spoiler extension', () => {
    describe('markdown', () => {
        it('should parse spoiler directive', () =>
            same(':spoiler[hidden text]', doc(p(s('hidden text')))));

        it('should parse spoiler inside text', () =>
            same('one :spoiler[two] three', doc(p('one ', s('two'), ' three'))));

        it('should parse spoiler inside a word', () =>
            same('wo:spoiler[rd]s', doc(p('wo', s('rd'), 's'))));

        it('should keep inline marks inside spoiler', () =>
            same(
                ':spoiler[a **bold** *italic* `code` [link](https://example.com)]',
                doc(
                    p(
                        s(
                            'a ',
                            b('bold'),
                            ' ',
                            i('italic'),
                            ' ',
                            c('code'),
                            ' ',
                            a({href: 'https://example.com'}, 'link'),
                        ),
                    ),
                ),
            ));

        it('should keep a spoiler that covers a whole link in one directive', () =>
            same(
                ':spoiler[[link](https://example.com)]',
                doc(p(s(a({href: 'https://example.com'}, 'link')))),
            ));

        it('should split bold text around spoiler', () => {
            serialize(doc(p(b('a '), s(b('b')), b(' c'))), '**a** :spoiler[**b**] **c**');
            parse('**a** :spoiler[**b**] **c**', doc(p(b('a'), ' ', s(b('b')), ' ', b('c'))));
        });

        it('should parse several spoilers in one paragraph', () =>
            same(':spoiler[one] and :spoiler[two]', doc(p(s('one'), ' and ', s('two')))));

        it('should merge adjacent spoilers', () => {
            parse(':spoiler[one]:spoiler[two]', doc(p(s('onetwo'))));
            serialize(doc(p(s('one'), s('two'))), ':spoiler[onetwo]');
        });

        it('should escape square brackets and backslashes', () =>
            same(':spoiler[a \\[b\\] c\\\\]', doc(p(s('a [b] c\\')))));

        it('should parse balanced brackets without escapes', () =>
            parse(':spoiler[a [b] c]', doc(p(s('a [b] c')))));

        it('should keep a code span with a closing bracket', () =>
            same(':spoiler[`a]`]', doc(p(s(c('a]'))))));

        it('should parse text in parentheses after spoiler as text', () =>
            parse(':spoiler[a](b)', doc(p(s('a'), '(b)'))));

        it('should keep text in parentheses after spoiler on round trip', () => {
            const markup = serializer.serialize(doc(p(s('a'), '(b)')));
            parse(markup, doc(p(s('a'), '(b)')));
        });

        it('should keep plain text that looks like a directive', () =>
            same('a :spoiler\\[text\\]', doc(p('a :spoiler[text]'))));

        it('should not parse empty spoiler', () => parse(':spoiler[]', doc(p(':spoiler[]'))));

        it('should not parse spoiler without square brackets', () =>
            parse(':spoiler text', doc(p(':spoiler text'))));

        it('should keep line breaks inside spoiler', () =>
            same(':spoiler[first\\\nsecond]', doc(p(s('first', hb(), 'second')))));

        it('should keep spoilers in different paragraphs', () =>
            same(':spoiler[first]\n\n:spoiler[second]', doc(p(s('first')), p(s('second')))));

        it('should parse html', () => {
            parseDOM(
                schema,
                '<p><span class="yfm-spoiler"><span class="yfm-spoiler__content">text</span></span></p>',
                doc(p(s('text'))),
            );
        });
    });

    describe('toggle', () => {
        it('should add spoiler to selection', () => {
            const state = createState(doc(p('hello world')), 1, 6);
            const {tr} = applyCommand(state, toggleMark(spoilerType));

            expect(tr.doc).toMatchNode(doc(p(s('hello'), ' world')));
            expect(serializer.serialize(tr.doc)).toBe(':spoiler[hello] world');
        });

        it('should continue spoiler after typing at the cursor', () => {
            let state = createState(doc(p('a ')), 3);
            state = state.apply(applyCommand(state, toggleMark(spoilerType)).tr);
            state = state.apply(state.tr.insertText('secret'));
            state = state.apply(state.tr.insertText('!'));

            expect(state.doc).toMatchNode(doc(p('a ', s('secret!'))));
        });

        it('should remove spoiler from selection', () => {
            const state = createState(doc(p(s('hello world'))), 1, 6);
            const {tr} = applyCommand(state, toggleMark(spoilerType));

            expect(tr.doc).toMatchNode(doc(p('hello', s(' world'))));
        });

        it('should remove spoiler from mixed selection', () => {
            const state = createState(doc(p('one ', s('two'), ' three')), 1, 14);
            const {tr} = applyCommand(state, toggleMark(spoilerType));

            expect(tr.doc).toMatchNode(doc(p('one two three')));
        });

        it('should keep other marks', () => {
            const state = createState(doc(p(b('bold'), ' ', i('italic'))), 1, 12);
            const {tr} = applyCommand(state, toggleMark(spoilerType));

            expect(tr.doc).toMatchNode(doc(p(s(b('bold'), ' ', i('italic')))));
            expect(serializer.serialize(tr.doc)).toBe(':spoiler[**bold** *italic*]');
        });

        it('should undo and redo spoiler', () => {
            const initial = doc(p('hello world'));
            let state = createState(initial, 1, 6);
            state = state.apply(applyCommand(state, toggleMark(spoilerType)).tr);
            expect(state.doc).toMatchNode(doc(p(s('hello'), ' world')));

            state = state.apply(applyCommand(state, undo).tr);
            expect(state.doc).toMatchNode(initial);

            state = state.apply(applyCommand(state, redo).tr);
            expect(state.doc).toMatchNode(doc(p(s('hello'), ' world')));
        });

        it('should keep text inside spoiler editable', () => {
            let state = createState(doc(p(s('hidden'))), 4);
            state = state.apply(state.tr.insertText('ABC'));

            expect(state.doc).toMatchNode(doc(p(s('hidABCden'))));
            expect(serializer.serialize(state.doc)).toBe(':spoiler[hidABCden]');
        });
    });

    describe('editing plugin', () => {
        const content = doc(p('one ', s('two', b('three')), ' four ', s('five')));

        it('should find spoiler at the cursor', () => {
            const state = createState(content, 7);
            expect(findSelectedSpoilers(state, spoilerType)).toEqual([{from: 5, to: 13}]);
        });

        it('should find spoiler at its edges', () => {
            expect(findSelectedSpoilers(createState(content, 5), spoilerType)).toEqual([
                {from: 5, to: 13},
            ]);
            expect(findSelectedSpoilers(createState(content, 13), spoilerType)).toEqual([
                {from: 5, to: 13},
            ]);
        });

        it('should find all spoilers in the selection', () => {
            const state = createState(content, 2, 20);
            expect(findSelectedSpoilers(state, spoilerType)).toEqual([
                {from: 5, to: 13},
                {from: 19, to: 23},
            ]);
        });

        it('should not find spoilers away from the cursor', () => {
            expect(findSelectedSpoilers(createState(content, 2), spoilerType)).toEqual([]);
        });

        it('should not change document and history', () => {
            const plugin = spoilerEditingPlugin();
            let state = createState(content, 2, 2, [plugin]);
            state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 7)));

            const decorations = plugin.props.decorations?.call(plugin, state) as DecorationSet;
            expect(decorations?.find()).toHaveLength(1);
            expect(state.doc).toMatchNode(content);
            expect(undoDepth(state)).toBe(0);
            expect(serializer.serialize(state.doc)).toBe(
                'one :spoiler[two**three**] four :spoiler[five]',
            );
        });
    });
});
