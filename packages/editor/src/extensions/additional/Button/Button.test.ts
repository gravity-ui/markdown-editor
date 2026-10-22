import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BlockquoteSpecs, blockquoteNodeName} from '../../markdown/specs';

import {
    BUTTON_TARGET_BLANK,
    ButtonAttr,
    ButtonColor,
    ButtonSpecs,
    type ButtonStyle,
    ButtonView,
    buttonDirective,
    buttonNodeName,
} from './ButtonSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(BlockquoteSpecs).use(ButtonSpecs),
}).buildDeps();

const {doc, p, bq} = builders<'doc' | 'p' | 'bq'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    bq: {nodeType: blockquoteNodeName},
});

const button = (
    label: string,
    href: string,
    {view, color}: ButtonStyle = {view: ButtonView.Action, color: ButtonColor.Default},
    target = '',
) =>
    schema.node(buttonNodeName, {
        [ButtonAttr.Label]: label,
        [ButtonAttr.Href]: href,
        [ButtonAttr.View]: view,
        [ButtonAttr.Color]: color,
        [ButtonAttr.Target]: target,
    });

const accent = {view: ButtonView.Action, color: ButtonColor.Default};

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

    it.each([
        ['::button[Open](/a){color=green}', {view: ButtonView.Action, color: ButtonColor.Green}],
        [
            '::button[Open](/a){view=normal color=gray}',
            {view: ButtonView.Normal, color: ButtonColor.Gray},
        ],
        [
            '::button[Open](/a){view=outlined color=red}',
            {view: ButtonView.Outlined, color: ButtonColor.Red},
        ],
        ['::button[Open](/a){view=flat}', {view: ButtonView.Flat, color: ButtonColor.Default}],
    ])('should keep the style of %s', (markup, style) => {
        same(markup, doc(button('Open', '/a', style)));
    });

    it.each([
        [
            'an unknown view',
            '{view=link color=red}',
            {view: ButtonView.Action, color: ButtonColor.Red},
        ],
        ['an unknown color', '{color=pink}', {view: ButtonView.Action, color: ButtonColor.Default}],
        [
            'a color the view lacks',
            '{view=normal color=orange}',
            {view: ButtonView.Normal, color: ButtonColor.Gray},
        ],
    ])('should normalize %s', (_name, attrs, style) => {
        parse(`::button[Open](/a)${attrs}`, doc(button('Open', '/a', style)));
    });

    it('should keep a new tab target after the style', () => {
        same(
            '::button[Open](/a){color=red target=_blank}',
            doc(button('Open', '/a', {...accent, color: ButtonColor.Red}, BUTTON_TARGET_BLANK)),
        );
    });

    it('should drop an unknown target', () => {
        parse('::button[Open](/a){target=_top}', doc(button('Open', '/a')));
    });

    it('should render a new tab link without access to the opener', () => {
        expect(md.render('::button[Open](/a){target=_blank}')).toBe(
            '<div class="g-md-button"><a class="g-md-button__action" data-view="action" data-color="default" href="/a" target="_blank" rel="noopener noreferrer">Open</a></div>\n',
        );
    });

    it('should render a link with the style and the escaped label', () => {
        expect(md.render('::button[<b>](/а){view=outlined color=blue}')).toBe(
            '<div class="g-md-button"><a class="g-md-button__action" data-view="outlined" data-color="blue" href="/%D0%B0">&lt;b&gt;</a></div>\n',
        );
    });
});
