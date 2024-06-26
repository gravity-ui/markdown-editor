import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {LinkAttr, LinkSpecs, linkMarkName} from './LinkSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(LinkSpecs),
}).buildDeps();

const {doc, p, a, lnk, lnk4} = builders<'doc' | 'p' | 'a' | 'lnk' | 'lnk4'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    a: {nodeType: linkMarkName},
    lnk: {nodeType: linkMarkName, [LinkAttr.Href]: 'ya.ru'},
    lnk4: {
        nodeType: linkMarkName,
        [LinkAttr.Href]: '4chan.org',
        [LinkAttr.Title]: '4chan',
    },
});

const {same, serialize} = createMarkupChecker({parser, serializer});

describe('Link extension', () => {
    it('should parse link', () => {
        same('[yandex](ya.ru)', doc(p(lnk('yandex'))));
    });

    it('should parse link with title', () => {
        same('[imageboard](4chan.org "4chan")', doc(p(lnk4('imageboard'))));
    });

    it('ensure no escapes in url', () => {
        same(
            '[text](https://example.com/+_file/#~anchor)',
            doc(p(a({[LinkAttr.Href]: 'https://example.com/+_file/#~anchor'}, 'text'))),
        );
    });

    it('ensure no escapes in autolinks', () => {
        same(
            '<https://example.com/+_file/#~anchor>',
            doc(
                p(
                    a(
                        {[LinkAttr.Href]: 'https://example.com/+_file/#~anchor'},
                        'https://example.com/+_file/#~anchor',
                    ),
                ),
            ),
        );
    });

    it('ensure no escapes in raw links', () => {
        serialize(
            doc(
                p(
                    a(
                        {
                            [LinkAttr.Href]: 'https://example.com/+_file/#~anchor',
                            [LinkAttr.RawLink]: true,
                        },
                        'https://example.com/+_file/#~anchor',
                    ),
                ),
            ),
            'https://example.com/+_file/#~anchor',
        );
    });

    it('should escape parentheses in url', () =>
        same(
            '[parentheses](https://example.com/example=?qwe\\(asd)',
            doc(p(a({[LinkAttr.Href]: 'https://example.com/example=?qwe(asd'}, 'parentheses'))),
        ));

    it('should escape parentheses in url', () =>
        same(
            '[parentheses2](https://example.com/example=?qwe\\(asd\\)\\))',
            doc(p(a({[LinkAttr.Href]: 'https://example.com/example=?qwe(asd))'}, 'parentheses2'))),
        ));
});
