import {EditorState, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {dispatchPasteEvent} from '../../../../tests/dispatch-event';
import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {WysiwygEditor} from '../../../core/Editor';
import {YfmSpecsPreset} from '../../../presets/yfm-specs';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {Clipboard} from '../../behavior/Clipboard';
import {
    BlockquoteSpecs,
    BoldSpecs,
    CodeSpecs,
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
            .use(BoldSpecs)
            .use(ItalicSpecs)
            .use(CodeSpecs)
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

describe('single-line serialization', () => {
    const blocks = [
        {name: 'note title', markup: '{% note info "TITLE" %}\n\nbody\n\n{% endnote %}'},
    ];
    describe.each([
        {name: 'LF', entity: '&#10;'},
        {name: 'CR', entity: '&#13;'},
        {name: 'CRLF', entity: '&#13;&#10;'},
    ])('single-line serialization with $name', ({entity}) => {
        it.each(blocks)('should normalize marked text in a $name', ({markup}) => {
            const input = parser.parse(markup.replace('TITLE', `*&#32;x${entity}y*`));
            const expected = parser.parse(markup.replace('TITLE', ' *x y*'));

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        });
    });

    describe('single-line serialization with inline code', () => {
        it.each(blocks)('should keep code and adjacent images in a $name', ({markup}) => {
            const expected = parser.parse(markup.replace('TITLE', '**A** *`x y`* ![i](img)'));
            let textPosition = -1;
            expected.descendants((node, pos) => {
                if (node.isText && node.text === 'x y') textPosition = pos;
            });
            expect(textPosition).toBeGreaterThan(-1);
            const input = EditorState.create({doc: expected}).tr.insertText(
                'x\ny',
                textPosition,
                textPosition + 3,
            ).doc;

            expect(parser.parse(serializer.serialize(input))).toMatchNode(expected);
        });
    });

    describe('single-line editor input', () => {
        it('should normalize encoded line endings loaded through the editor API', () => {
            const editor = new WysiwygEditor({
                initialContent: '{% note info "*&#32;x&#10;y*" %}\n\nbody\n\n{% endnote %}',
                extensions: (builder) => builder.use(YfmSpecsPreset, {}),
            });
            try {
                expect(editor.doc.textContent).toContain('x\ny');
                expect(parser.parse(editor.getValue())).toMatchNode(
                    parser.parse('{% note info " *x y*" %}\n\nbody\n\n{% endnote %}'),
                );
            } finally {
                editor.destroy();
            }
        });

        it('should normalize a pasted carriage return inside title code', () => {
            const editor = new WysiwygEditor({
                initialContent: '{% note info "`AB`" %}\n\nbody\n\n{% endnote %}',
                extensions: (builder) => builder.use(YfmSpecsPreset, {}).use(Clipboard, {}),
            });
            try {
                let textPosition = -1;
                editor.doc.descendants((node, pos) => {
                    if (node.isText && node.text === 'AB') textPosition = pos + 1;
                });
                expect(textPosition).toBeGreaterThan(-1);
                const {view} = editor;
                view.dispatch(
                    view.state.tr.setSelection(TextSelection.create(editor.doc, textPosition)),
                );

                dispatchPasteEvent(view, {'text/plain': 'x\ry'});

                expect(editor.doc.textContent).toContain('Ax\ryB');
                expect(parser.parse(editor.getValue())).toMatchNode(
                    parser.parse('{% note info "`Ax yB`" %}\n\nbody\n\n{% endnote %}'),
                );
            } finally {
                editor.destroy();
            }
        });
    });
});
