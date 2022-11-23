import {builders} from 'prosemirror-test-builder';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {Breaks, hbType} from './index';

const {schema} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Breaks, {}),
}).buildDeps();

const {doc, p, hb} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    hb: {nodeType: hbType(schema).name},
}) as PMTestBuilderResult<'doc' | 'p' | 'hb'>;

describe('Breaks extension', () => {
    it('should parse html - br tag', () => {
        parseDOM(schema, '<div>hello<br>world!</div>', doc(p('hello', hb(), 'world!')));
    });
});
