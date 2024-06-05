import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';

import {YfmFileSpecs, yfmFileNodeName} from './YfmFileSpecs';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSpecsPreset, {}).use(YfmFileSpecs),
}).buildDeps();

const {same} = createMarkupChecker({parser, serializer});

const {doc, p, file} = builders<'doc' | 'p' | 'file'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    file: {nodeType: yfmFileNodeName},
});

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
