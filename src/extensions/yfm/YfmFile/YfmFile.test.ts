import {FILE_TOKEN} from '@doc-tools/transform/lib/plugins/file/const';
import {builders} from 'prosemirror-test-builder';

import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {parseDOM} from '../../../../tests/parse-dom';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchema} from '../../base/BaseSchema';
import {YfmFile} from './index';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchema, {}).use(YfmFile),
}).buildDeps();

const {same} = createMarkupChecker({parser, serializer});

const {doc, p, file} = builders(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    file: {nodeType: FILE_TOKEN},
}) as PMTestBuilderResult<'doc' | 'p' | 'file'>;

const defaultAttrs = {
    href: 'path/to/readme',
    download: 'readme.md',
    hreflang: null,
    referrerpolicy: null,
    rel: null,
    target: null,
    type: null,
};

describe('YFM File extension', () => {
    it('should parse file', () => {
        same('{% file src="path/to/readme" name="readme.md" %}', doc(p(file(defaultAttrs))));
    });

    it('should parse file with text before', () => {
        same(
            'This is file: {% file src="path/to/readme" name="readme.md" %}',
            doc(p('This is file: ', file(defaultAttrs))),
        );
    });

    it('should parse file with text after', () => {
        same(
            '{% file src="path/to/readme" name="readme.md" %} - download it',
            doc(p(file(defaultAttrs), ' - download it')),
        );
    });

    it('should parse file between text', () => {
        same(
            'This is file: {% file src="path/to/readme" name="readme.md" %} - download it',
            doc(p('This is file: ', file(defaultAttrs), ' - download it')),
        );
    });

    it('should parse file with all attributes', () => {
        same(
            '{% file src="path/to/readme" name="readme.md" lang="ru" referrerpolicy="origin" rel="help" target="_top" type="text/markdown" %}',
            doc(
                p(
                    file({
                        href: 'path/to/readme',
                        download: 'readme.md',
                        hreflang: 'ru',
                        referrerpolicy: 'origin',
                        rel: 'help',
                        target: '_top',
                        type: 'text/markdown',
                    }),
                ),
            ),
        );
    });

    it('should parse yfm-file from html', () => {
        parseDOM(
            schema,
            '<div>File: <a class="yfm-file" href="path/to/readme" download="readme.md"></a><div>',
            doc(
                p(
                    'File: ',
                    file({
                        href: 'path/to/readme',
                        download: 'readme.md',
                    }),
                ),
            ),
        );
    });
});
