import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {createExtension, ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {MathNode} from './const';
import {Math} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), createExtension((b) => b.use(Math))()],
}).buildDeps();

const {doc, p, mathB, mathI} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    text: {nodeType: BaseNode.Text},
    mathB: {nodeType: MathNode.Block},
    mathI: {nodeType: MathNode.Inline},
}) as PMTestBuilderResult<'doc' | 'p' | 'mathB' | 'mathI'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Math extension', () => {
    it('should parse inline math', () =>
        same(
            'Inline math: $\\sqrt{3x-1}+(1+x)^2$',
            doc(p('Inline math: ', mathI('\\sqrt{3x-1}+(1+x)^2'))),
        ));

    it('should parse block math', () => {
        const formula = `
\\begin{array}{c}

\\nabla \\times \\vec{\\mathbf{B}} -\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} &
= \\frac{4\\pi}{c}\\vec{\\mathbf{j}}    \\nabla \\cdot \\vec{\\mathbf{E}} & = 4 \\pi \\rho \\\\

\\nabla \\times \\vec{\\mathbf{E}}\\, +\\, \\frac1c\\, \\frac{\\partial\\vec{\\mathbf{B}}}{\\partial t} & = \\vec{\\mathbf{0}} \\\\

\\nabla \\cdot \\vec{\\mathbf{B}} & = 0

\\end{array}
`.trim();
        same(`$$${formula}$$\n\n`, doc(mathB(formula)));
    });
});
