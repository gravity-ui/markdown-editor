import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {ColorSpecs, colorMarkName} from './ColorSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder.use(BaseSchemaSpecs, {}).use(ColorSpecs, {
            validateClassNameColorName: (color) => color !== 'something',
            parseStyleColorValue: (value: string) => (value === 'darkred' ? 'red' : null),
        }),
}).buildDeps();

const {doc, p, color, c1, c2} = builders<'doc' | 'p', 'color' | 'c1' | 'c2'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    color: {markType: colorMarkName},
    c1: {nodeType: colorMarkName, [colorMarkName]: 'c1'},
    c2: {nodeType: colorMarkName, [colorMarkName]: 'c2'},
});

const {same} = createMarkupChecker({parser, serializer});

describe('Color extension', () => {
    it('should parse color', () => same('{c1}(hello!)', doc(p(c1('hello!')))));

    it('should parse code inside text', () =>
        same('he{c2}(llo wor)ld!', doc(p('he', c2('llo wor'), 'ld!'))));

    it('should parse nested color marks with escaped parentheses', () =>
        same(
            '{green}(some\\(){blue}(2,3){green}(\\))',
            doc(
                p(
                    color({[colorMarkName]: 'green'}, 'some('),
                    color({[colorMarkName]: 'blue'}, '2,3'),
                    color({[colorMarkName]: 'green'}, ')'),
                ),
            ),
        ));

    it('should parse span with md-colorify--* classname', () => {
        parseDOM(
            schema,
            '<span class="md-colorify--mdcolor">text with md color</span>',
            doc(p(color({[colorMarkName]: 'mdcolor'}, 'text with md color'))),
        );
    });

    it('should parse span with yfm-colorify--* classname', () => {
        parseDOM(
            schema,
            '<span class="yfm-colorify--yfmcolor">text with yfm color</span>',
            doc(p(color({[colorMarkName]: 'yfmcolor'}, 'text with yfm color'))),
        );
    });

    it('should not parse span with yfm-colorify--something classname', () => {
        parseDOM(
            schema,
            '<span class="yfm-colorify--something">text with yfm color</span>',
            doc(p('text with yfm color')),
        );
    });

    it('should parse span with style color darkred', () => {
        parseDOM(
            schema,
            '<span style="color:darkred">text with style color</span>',
            doc(p(color({[colorMarkName]: 'red'}, 'text with style color'))),
        );
    });

    it('should not parse span with style color red', () => {
        parseDOM(
            schema,
            '<span style="color:red">text with style color</span>',
            doc(p('text with style color')),
        );
    });

    it('should parse nested color spans for escaped parentheses', () => {
        parseDOM(
            schema,
            '<span class="yfm-colorify yfm-colorify--green">some(<span class="yfm-colorify yfm-colorify--blue">2,3</span><span class="yfm-colorify yfm-colorify--green">)</span></span>',
            doc(
                p(
                    color({[colorMarkName]: 'green'}, 'some('),
                    color({[colorMarkName]: 'blue'}, '2,3'),
                    color({[colorMarkName]: 'green'}, ')'),
                ),
            ),
        );
    });
});
