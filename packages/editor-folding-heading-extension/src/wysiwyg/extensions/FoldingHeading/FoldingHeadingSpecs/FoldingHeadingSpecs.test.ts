import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {
    BaseNode,
    BaseSchemaSpecs,
    ItalicSpecs,
    YfmHeadingSpecs,
    headingNodeName,
    italicMarkName,
} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {YfmHeadingAttr} from '../const';

import {FoldingHeadingSpecs} from './FoldingHeadingSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(ItalicSpecs)
            .use(YfmHeadingSpecs, {})
            .use(FoldingHeadingSpecs),
}).buildDeps();

const {doc, h1, h2, h3, h4, h5, h6, i} = builders<
    'doc' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    'i'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    h1: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 1},
    h2: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 2},
    h3: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 3},
    h4: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 4},
    h5: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 5},
    h6: {nodeType: headingNodeName, [YfmHeadingAttr.Level]: 6},
    i: {markType: italicMarkName},
});

function same(text: string, node: Node) {
    expect(markupParser.parse(text).toJSON()).toEqual(node.toJSON());
    expect(serializer.serialize(node)).toBe(text);
}

describe('Folding Headings', () => {
    it('should parse folding headings', () => {
        const markup = `
#+ heading 1

##+ heading 2

###+ heading 3

####+ heading 4

#####+ heading 5

######+ heading 6
`.trim();

        return same(
            markup,
            doc(
                h1({[YfmHeadingAttr.Folding]: true}, 'heading 1'),
                h2({[YfmHeadingAttr.Folding]: true}, 'heading 2'),
                h3({[YfmHeadingAttr.Folding]: true}, 'heading 3'),
                h4({[YfmHeadingAttr.Folding]: true}, 'heading 4'),
                h5({[YfmHeadingAttr.Folding]: true}, 'heading 5'),
                h6({[YfmHeadingAttr.Folding]: true}, 'heading 6'),
            ),
        );
    });

    it('should parse common headings', () => {
        const markup = `
# heading 1

## heading 2

### heading 3

#### heading 4

##### heading 5

###### heading 6
`.trim();

        return same(
            markup,
            doc(
                h1('heading 1'),
                h2('heading 2'),
                h3('heading 3'),
                h4('heading 4'),
                h5('heading 5'),
                h6('heading 6'),
            ),
        );
    });

    it('should parse folding heading with inline markup', () => {
        const markup = `
##+ *heading* 2
`.trim();

        return same(markup, doc(h2({[YfmHeadingAttr.Folding]: true}, i('heading'), ' 2')));
    });
});
