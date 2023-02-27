import {builders} from 'prosemirror-test-builder';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {BreakNodeName, BreaksSpecs} from './BreaksSpecs';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(BreaksSpecs, {}),
}).buildDeps();

const {doc, p, hb} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    hb: {nodeType: BreakNodeName.HardBreak},
}) as PMTestBuilderResult<'doc' | 'p' | 'hb'>;

describe('Breaks extension', () => {
    it('should parse html - br tag', () => {
        parseDOM(schema, '<div>hello<br>world!</div>', doc(p('hello', hb(), 'world!')));
    });
});
