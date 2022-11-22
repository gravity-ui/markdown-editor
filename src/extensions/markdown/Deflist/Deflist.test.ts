import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {Deflist} from './index';
import {DeflistNode} from './const';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(Deflist, {}),
}).buildDeps();

const {doc, p, dl, dt, dd} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    dl: {nodeType: DeflistNode.List},
    dt: {nodeType: DeflistNode.Term},
    dd: {nodeType: DeflistNode.Desc},
}) as PMTestBuilderResult<'doc' | 'p' | 'dl' | 'dt' | 'dd'>;

const {same} = createMarkupChecker({parser, serializer});

describe('Deflist extension', () => {
    it('should parse a deflist', () => {
        same(['Term', ': Description'].join('\n'), doc(dl(dt('Term'), dd(p('Description')))));
    });

    it('should parse a deflist with few terms', () => {
        const markup = `
Term 1
: Description 1

Term 2
: Description 2
`.trim();

        return same(
            markup,
            doc(dl(dt('Term 1'), dd(p('Description 1')), dt('Term 2'), dd(p('Description 2')))),
        );
    });

    it('should parse a nested deflists', () => {
        const markup = `
Term 1
: Description 1

  Term 1.1
  : Description 1.1

Term 2
: Description 2
`.trim();

        return same(
            markup,
            doc(
                dl(
                    dt('Term 1'),
                    dd(p('Description 1'), dl(dt('Term 1.1'), dd(p('Description 1.1')))),
                    dt('Term 2'),
                    dd(p('Description 2')),
                ),
            ),
        );
    });

    // TODO: pasrsed to: doc(dt("Term"), dd(paragraph("Description")))
    it.skip('should parse html', () => {
        parseDOM(
            schema,
            '<div><dl><dt>Term</dt><dd>Description</dd></dl></div>',
            doc(dl(dt('Term'), dd(p('Description')))),
        );
    });
});
