import {builders} from 'prosemirror-test-builder';
import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {BoldSpecs, boldMarkName} from '../../markdown/Bold/BoldSpecs';
import {BreakNodeName, BreaksSpecs} from './BreaksSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(BreaksSpecs, {}).use(BoldSpecs),
}).buildDeps();

const {doc, p, hb, sb, bold} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    hb: {nodeType: BreakNodeName.HardBreak},
    sb: {nodeType: BreakNodeName.SoftBreak},
    bold: {markType: boldMarkName},
}) as PMTestBuilderResult<'doc' | 'p' | 'hb' | 'sb', 'bold'>;

const {serialize} = createMarkupChecker({parser, serializer});

describe('Breaks extension', () => {
    it('should serialize hard break', () =>
        serialize(
            doc(p('Lorem ', bold('ipsum', hb()), 'dolor sit amet')),
            'Lorem **ipsum**\\\ndolor sit amet',
        ));

    it('should serialize soft break', () =>
        serialize(
            doc(p('Lorem ', bold('ipsum', sb()), 'dolor sit amet')),
            'Lorem **ipsum**\ndolor sit amet',
        ));

    it('should parse html - br tag', () => {
        parseDOM(schema, '<div>hello<br>world!</div>', doc(p('hello', hb(), 'world!')));
    });
});
