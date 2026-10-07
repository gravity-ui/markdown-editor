import MarkdownIt from 'markdown-it';
import {DOMSerializer} from 'prosemirror-model';
import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';
import {describe, expect, it} from 'vitest';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/specs';
import {Colors} from '../Color/const';
import {CutAttr, CutNode, YfmCutSpecs} from '../YfmCut/YfmCutSpecs';

import {StatusAttr, StatusSpecs, statusColors, statusNodeName, statusPlugin} from './StatusSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => {
        builder.context.set('directiveSyntax', new DirectiveContext(undefined));
        builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(YfmCutSpecs, {}).use(StatusSpecs);
    },
}).buildDeps();

const {doc, p, bq, cut, cutTitle, cutContent, status} = builders<
    'doc' | 'p' | 'bq' | 'cut' | 'cutTitle' | 'cutContent' | 'status'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
    cut: {nodeType: CutNode.Cut},
    cutTitle: {nodeType: CutNode.CutTitle},
    cutContent: {nodeType: CutNode.CutContent},
    status: {nodeType: statusNodeName},
});

const {same, parse, serialize} = createMarkupChecker({parser, serializer});

describe('Status extension', () => {
    it.each(statusColors)('should parse and serialize the %s color', (color) => {
        const markup =
            color === Colors.Gray ? ':status[In progress]' : `:status[In progress]{color=${color}}`;

        same(markup, doc(p(status({[StatusAttr.Text]: 'In progress', [StatusAttr.Color]: color}))));
    });

    it('should keep text around the badge', () => {
        same(
            'Task is :status[done]{color=green} already',
            doc(
                p(
                    'Task is ',
                    status({[StatusAttr.Text]: 'done', [StatusAttr.Color]: Colors.Green}),
                    ' already',
                ),
            ),
        );
    });

    it('should fall back to the gray color for an unknown value', () => {
        const node = doc(
            p(status({[StatusAttr.Text]: 'In progress', [StatusAttr.Color]: Colors.Gray})),
        );

        parse(':status[In progress]{color=pink}', node);
        serialize(node, ':status[In progress]');
    });

    it('should escape brackets and backslashes in the caption', () => {
        same(
            ':status[a\\] b \\\\ c]',
            doc(p(status({[StatusAttr.Text]: 'a] b \\ c', [StatusAttr.Color]: Colors.Gray}))),
        );
    });

    it('should keep markup characters in the caption as plain text', () => {
        same(
            ':status[**bold** _and_ `code`]{color=red}',
            doc(
                p(
                    status({
                        [StatusAttr.Text]: '**bold** _and_ `code`',
                        [StatusAttr.Color]: Colors.Red,
                    }),
                ),
            ),
        );
    });

    it('should parse the badge inside a quote', () => {
        same(
            '> :status[On review]{color=blue}',
            doc(bq(p(status({[StatusAttr.Text]: 'On review', [StatusAttr.Color]: Colors.Blue})))),
        );
    });

    it('should parse the badge inside a cut', () => {
        same(
            dd`
            {% cut "cut title" %}

            :status[On review]{color=blue}

            {% endcut %}
            `.trim(),
            doc(
                cut(
                    {[CutAttr.Markup]: '{%'},
                    cutTitle('cut title'),
                    cutContent(
                        p(
                            status({
                                [StatusAttr.Text]: 'On review',
                                [StatusAttr.Color]: Colors.Blue,
                            }),
                        ),
                    ),
                ),
            ),
        );
    });

    it('should render the same html in the markup and wysiwyg modes', () => {
        const markup = ':status[In progress]{color=green}';
        const node = status({[StatusAttr.Text]: 'In progress', [StatusAttr.Color]: Colors.Green});
        const dom = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;

        expect(dom.outerHTML).toBe(new MarkdownIt().use(statusPlugin).renderInline(markup));
    });

    it('should parse the badge from html', () => {
        parseDOM(
            schema,
            '<p><span class="g-md-status g-md-status_color_green" data-qa="status" data-color="green">Done</span></p>',
            doc(p(status({[StatusAttr.Text]: 'Done', [StatusAttr.Color]: Colors.Green}))),
        );
    });

    it('should fall back to the gray color when html carries an unknown value', () => {
        parseDOM(
            schema,
            '<p><span class="g-md-status" data-color="pink">Done</span></p>',
            doc(p(status({[StatusAttr.Text]: 'Done', [StatusAttr.Color]: Colors.Gray}))),
        );
    });
});
