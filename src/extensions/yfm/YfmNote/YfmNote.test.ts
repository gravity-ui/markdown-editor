import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {
    ItalicSpecs,
    BlockquoteSpecs,
    italicMarkName,
    blockquoteNodeName,
} from '../../markdown/specs';
import {YfmNoteSpecs} from './YfmNoteSpecs';
import {NoteAttrs, NoteNode} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSpecsPreset, {})
            .use(ItalicSpecs)
            .use(BlockquoteSpecs)
            .use(YfmNoteSpecs, {}),
}).buildDeps();

const {doc, p, i, bq, note, noteTitle} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italicMarkName},
    bq: {nodeType: blockquoteNodeName},
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

    // TODO: parsed: doc(paragraph("YfmNote title"), paragraph("YfmNote content"))
    it.skip('should parse yfm-note from html', () => {
        parseDOM(
            schema,
            '<div><div class="yfm-note yfm-accent-info" note-type="info">' +
                '<p class="yfm-note-title">YfmNote title</p>' +
                '<p>YfmNote content</p>' +
                '</div></div>',
            doc(note(noteTitle('YfmNote title'), p('YfmNote content'))),
        );
    });
});
