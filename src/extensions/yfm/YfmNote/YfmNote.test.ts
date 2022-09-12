import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {italic, ItalicE, blockquote, BlockquoteE} from '../../markdown';
import {NoteAttrs, NoteNode} from './const';
import {YfmNoteE} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt(),
    extensions: [BaseSchemaE(), ItalicE(), BlockquoteE(), YfmNoteE()],
}).buildDeps();

const {doc, p, i, bq, note, noteTitle} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italic},
    bq: {nodeType: blockquote},
    note: {
        nodeType: NoteNode.Note,
        [NoteAttrs.Type]: 'info',
        [NoteAttrs.Class]: 'yfm-note yfm-accent-info',
    },
    noteTitle: {nodeType: NoteNode.NoteTitle},
}) as PMTestBuilderResult<'doc' | 'p' | 'bq' | 'note' | 'noteTitle', 'i'>;

const {same} = createMarkupChecker({parser, serializer});

describe('YfmNote extension', () => {
    it('should parse yfm-note', () => {
        const markup = `
{% note info "note title" %}

note content

note content 2

{% endnote %}
`.trim();

        same(markup, doc(note(noteTitle('note title'), p('note content'), p('note content 2'))));
    });

    it('should parse nested yfm-notes', () => {
        const markup = `
{% note info "note title" %}

{% note info "note title 2" %}

note content

{% endnote %}

{% endnote %}
`.trim();

        same(
            markup,
            doc(note(noteTitle('note title'), note(noteTitle('note title 2'), p('note content')))),
        );
    });

    it('should parse yfm-note under blockquote', () => {
        const markup = `
> {% note info "note title" %}
> 
> note content
>
> {% endnote %}
`.trim();

        same(markup, doc(bq(note(noteTitle('note title'), p('note content')))));
    });

    it('should parse yfm-note with inline markup in note title', () => {
        const markup = `
{% note info "*note italic title*" %}

note content

{% endnote %}
    `.trim();

        // eslint-disable-next-line prettier/prettier
        same(markup, doc(note(noteTitle(i('note italic title')), p('note content'))));
    });
});
