import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {bold, BoldE} from '../../markdown/Bold';
import {YfmHeadingE} from './index';
import {heading, YfmHeadingAttr} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: [BaseSchemaE(), YfmHeadingE(), BoldE()],
    options: {attrsOpts: {allowedAttributes: ['id']}},
}).buildDeps();

const {doc, b, p, h1, h2, h3, h4, h5, h6} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    b: {nodeType: bold},
    p: {nodeType: BaseNode.Paragraph},
    h1: {nodeType: heading, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 1},
    h2: {nodeType: heading, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 2},
    h3: {nodeType: heading, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 3},
    h4: {nodeType: heading, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 4},
    h5: {nodeType: heading, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 5},
    h6: {nodeType: heading, [YfmHeadingAttr.Id]: '', [YfmHeadingAttr.Level]: 6},
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
        same(
            '## heading with **bold** {#heading-with-bold}',
            doc(h2({[YfmHeadingAttr.Id]: 'heading-with-bold'}, 'heading with ', b('bold'))),
        );
    });

    it('should parse few headings', () => {
        const markup = `
# h1 {#one}

## h2 {#two}

### h3 {#three}

#### h4 {#four}

##### h5 {#five}

###### h6 {#six}

para
`.trim();

        same(
            markup,
            doc(
                h1({[YfmHeadingAttr.Id]: 'one'}, 'h1'),
                h2({[YfmHeadingAttr.Id]: 'two'}, 'h2'),
                h3({[YfmHeadingAttr.Id]: 'three'}, 'h3'),
                h4({[YfmHeadingAttr.Id]: 'four'}, 'h4'),
                h5({[YfmHeadingAttr.Id]: 'five'}, 'h5'),
                h6({[YfmHeadingAttr.Id]: 'six'}, 'h6'),
                p('para'),
            ),
        );
    });
});
