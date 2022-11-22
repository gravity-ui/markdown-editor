import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {bold, Bold} from '../Bold';
import {Heading} from './index';
import {heading, lvlAttr} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Heading, {}).use(Bold, {}),
}).buildDeps();

const {doc, b, p, h, h1, h2, h3, h4, h5, h6} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    b: {nodeType: bold},
    p: {nodeType: BaseNode.Paragraph},
    h: {nodeType: heading},
    h1: {nodeType: heading, [lvlAttr]: 1},
    h2: {nodeType: heading, [lvlAttr]: 2},
    h3: {nodeType: heading, [lvlAttr]: 3},
    h4: {nodeType: heading, [lvlAttr]: 4},
    h5: {nodeType: heading, [lvlAttr]: 5},
    h6: {nodeType: heading, [lvlAttr]: 6},
}) as PMTestBuilderResult<'doc' | 'p' | 'h' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', 'b'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Heading extension', () => {
    it('should parse h1', () => {
        same('# one', doc(h1('one')));
    });

    it('should parse h2', () => {
        same('## two', doc(h2('two')));
    });

    it('should parse h3', () => {
        same('### three', doc(h3('three')));
    });

    it('should parse h4', () => {
        same('#### four', doc(h4('four')));
    });

    it('should parse h5', () => {
        same('##### five', doc(h5('five')));
    });

    it('should parse h6', () => {
        same('###### six', doc(h6('six')));
    });

    it('should parse heading with marks', () => {
        same('## heading with **bold**', doc(h2('heading with ', b('bold'))));
    });

    it('should parse few headings', () => {
        const markup = [
            '# h1',
            '',
            '## h2',
            '',
            '### h3',
            '',
            '#### h4',
            '',
            '##### h5',
            '',
            '###### h6',
            '',
            'para',
        ].join('\n');

        same(markup, doc(h1('h1'), h2('h2'), h3('h3'), h4('h4'), h5('h5'), h6('h6'), p('para')));
    });

    it.each([1, 2, 3, 4, 5, 6])('should parse html - h%s tag', (lvl) => {
        parseDOM(
            schema,
            `<h${lvl}>Heading ${lvl}</h${lvl}>`,
            doc(h({[lvlAttr]: lvl}, `Heading ${lvl}`)),
        );
    });
});
