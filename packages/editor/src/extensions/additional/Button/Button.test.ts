import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/specs';

import {ButtonAttr, ButtonSpecs, buttonDirective, buttonNodeName} from './ButtonSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(ButtonSpecs),
}).buildDeps();

const {doc, p, bq} = builders<'doc' | 'p' | 'bq'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
});

const button = (label: string, href: string) =>
    schema.node(buttonNodeName, {[ButtonAttr.Label]: label, [ButtonAttr.Href]: href});

const {same, parse} = createMarkupChecker({parser: markupParser, serializer});

const md = new MarkdownIt().use(buttonDirective);

describe('Button', () => {
    it('should keep the label and the address', () => {
        same('::button[Open](https://example.com)', doc(button('Open', 'https://example.com')));
    });

    it('should escape brackets in the label and parentheses in the address', () => {
        same('::button[a \\[b\\]](/x\\(1\\))', doc(button('a [b]', '/x(1)')));
    });

    it('should keep an empty button', () => {
        same('::button[]()', doc(button('', '')));
    });

    it('should drop a forbidden address', () => {
        parse('::button[Run](javascript:alert(1))', doc(button('Run', '')));
    });

    it('should keep the button inside a quote', () => {
        same('> ::button[Open](/a)', doc(bq(button('Open', '/a'))));
    });

    it('should separate the button from a paragraph', () => {
        same('::button[Open](/a)\n\nText', doc(button('Open', '/a'), p('Text')));
    });

    it('should render a link with the escaped label', () => {
        expect(md.render('::button[<b>](/а)')).toBe(
            '<div class="g-md-button"><a class="g-md-button__action" href="/%D0%B0">&lt;b&gt;</a></div>\n',
        );
    });
});
