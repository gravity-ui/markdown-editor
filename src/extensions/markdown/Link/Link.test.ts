import MarkdownIt from 'markdown-it';
import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaE} from '../../base/BaseSchema';
import {link, LinkE, LinkAttr} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    md: new MarkdownIt('commonmark'),
    extensions: [BaseSchemaE(), LinkE()],
}).buildDeps();

const {doc, p, a, lnk, lnk4} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    a: {nodeType: link},
    lnk: {nodeType: link, [LinkAttr.Href]: 'ya.ru'},
    lnk4: {
        nodeType: link,
        [LinkAttr.Href]: '4chan.org',
        [LinkAttr.Title]: '4chan',
    },
}) as PMTestBuilderResult<'doc' | 'p' | 'a' | 'lnk' | 'lnk4'>;

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
});
