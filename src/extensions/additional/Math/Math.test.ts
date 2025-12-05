import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {MathNode, MathSpecs} from './MathSpecs';
import {isLatexMode, parseLatexFormulas} from './utils';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(MathSpecs),
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

describe('latex-paste-plugin utilities', () => {
    describe('isLatexMode', () => {
        it('should return true for tex/latex modes', () => {
            expect(isLatexMode('tex')).toBe(true);
            expect(isLatexMode('latex')).toBe(true);
            expect(isLatexMode('bibtex')).toBe(true);
        });

        it('should return false for non-latex modes', () => {
            expect(isLatexMode('javascript')).toBe(false);
            expect(isLatexMode('python')).toBe(false);
            expect(isLatexMode(undefined)).toBe(false);
        });
    });

    describe('parseLatexFormulas', () => {
        it('should split formulas by double newlines', () => {
            const input = 'E = mc^2\n\ne^{i\\pi} + 1 = 0';
            const result = parseLatexFormulas(input);
            expect(result).toEqual(['E = mc^2', 'e^{i\\pi} + 1 = 0']);
        });

        it('should filter out comment lines starting with %', () => {
            const input = `% Einstein equation
E = mc^2

% Euler formula
e^{i\\pi} + 1 = 0`;
            const result = parseLatexFormulas(input);
            expect(result).toEqual(['E = mc^2', 'e^{i\\pi} + 1 = 0']);
        });

        it('should return empty array for only comments', () => {
            const input = '% Comment 1\n% Comment 2';
            const result = parseLatexFormulas(input);
            expect(result).toEqual([]);
        });
    });
});
