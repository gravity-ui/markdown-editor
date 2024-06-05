import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';

import {MathNode, MathSpecs} from './MathSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(MathSpecs),
}).buildDeps();

const {doc, p, mathB, mathI} = builders<'doc' | 'p' | 'mathB' | 'mathI'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    text: {nodeType: BaseNode.Text},
    mathB: {nodeType: MathNode.Block},
    mathI: {nodeType: MathNode.Inline},
});

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
