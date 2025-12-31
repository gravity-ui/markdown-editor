import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {
    BlockquoteSpecs,
    ImageAttr,
    ImageSpecs,
    ItalicSpecs,
    blockquoteNodeName,
    imageNodeName,
    italicMarkName,
} from '../../markdown/specs';

import {YfmNoteSpecs} from './YfmNoteSpecs';
import {NoteAttrs, NoteNode} from './const';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(ItalicSpecs)
            .use(BlockquoteSpecs)
            .use(YfmNoteSpecs, {})
            .use(ImageSpecs),
}).buildDeps();

const {doc, p, i, bq, img, note, noteTitle, noteContent} = builders<
    'doc' | 'p' | 'bq' | 'img' | 'note' | 'noteTitle' | 'noteContent',
    'i'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    i: {markType: italicMarkName},
    bq: {nodeType: blockquoteNodeName},
    img: {nodeType: imageNodeName},
    note: {
        nodeType: NoteNode.Note,
        [NoteAttrs.Type]: 'info',
        [NoteAttrs.Class]: 'yfm-note yfm-accent-info',
    },
    noteTitle: {nodeType: NoteNode.NoteTitle},
    noteContent: {nodeType: NoteNode.NoteContent},
});

const {same} = createMarkupChecker({parser, serializer});

describe('YfmNote extension', () => {
    it('should parse yfm-note', () => {
        const markup = `
{% note info "note title" %}

note content

note content 2

{% endnote %}
`.trim();

        same(
            markup,
            doc(note(noteTitle('note title'), noteContent(p('note content'), p('note content 2')))),
        );
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
            doc(
                note(
                    noteTitle('note title'),
                    noteContent(note(noteTitle('note title 2'), noteContent(p('note content')))),
                ),
            ),
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

        same(markup, doc(bq(note(noteTitle('note title'), noteContent(p('note content'))))));
    });

    it('should parse yfm-note with inline markup in note title', () => {
        const markup = `
{% note info "*note italic title*" %}

note content

{% endnote %}
    `.trim();

        same(markup, doc(note(noteTitle(i('note italic title')), noteContent(p('note content')))));
    });

    it('should parse yfm-note with inline node in note title', () => {
        const markup = `
{% note info "![img](path/to/img)" %}

note content

{% endnote %}
    `.trim();

        same(
            markup,
            doc(
                note(
                    noteTitle(
                        img({
                            [ImageAttr.Src]: 'path/to/img',
                            [ImageAttr.Alt]: 'img',
                        }),
                    ),
                    noteContent(p('note content')),
                ),
            ),
        );
    });

    // TODO: parsed: doc(paragraph("YfmNote title"), paragraph("YfmNote content"))
    it.skip('should parse yfm-note from html', () => {
        parseDOM(
            schema,
            '<div><div class="yfm-note yfm-accent-info" note-type="info">' +
                '<p class="yfm-note-title">YfmNote title</p>' +
                '<p>YfmNote content</p>' +
                '</div></div>',
            doc(note(noteTitle('YfmNote title'), noteContent(p('YfmNote content')))),
        );
    });
});
