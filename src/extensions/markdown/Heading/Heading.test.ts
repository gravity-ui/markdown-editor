import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {bold, BoldE} from '../Bold';
import {HeadingE} from './index';
import {heading, lvlAttr} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), HeadingE(), BoldE()],
}).buildDeps();

const {doc, b, p, h1, h2, h3, h4, h5, h6} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    b: {nodeType: bold},
    p: {nodeType: BaseNode.Paragraph},
    h1: {nodeType: heading, [lvlAttr]: 1},
    h2: {nodeType: heading, [lvlAttr]: 2},
    h3: {nodeType: heading, [lvlAttr]: 3},
    h4: {nodeType: heading, [lvlAttr]: 4},
    h5: {nodeType: heading, [lvlAttr]: 5},
    h6: {nodeType: heading, [lvlAttr]: 6},
}) as PMTestBuilderResult<'doc' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', 'b'>;

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

    it('should parse haeding wiht marks', () => {
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
});
