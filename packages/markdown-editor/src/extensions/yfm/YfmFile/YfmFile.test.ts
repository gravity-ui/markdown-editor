import {builders} from 'prosemirror-test-builder';
import dd from 'ts-dedent';

import type {DirectiveSyntaxValue} from '../../../';
import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {DirectiveContext} from '../../../../tests/utils';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {YfmFileAttr, YfmFileSpecs, yfmFileNodeName} from './YfmFileSpecs';

function buildDeps(directiveSyntax: DirectiveSyntaxValue | undefined) {
    return new ExtensionsManager({
        options: {mdOpts: {preset: 'zero'}},
        extensions: (builder) => {
            builder.context.set('directiveSyntax', new DirectiveContext(directiveSyntax));
            builder.use(BaseSchemaSpecs, {}).use(YfmFileSpecs);
        },
    }).buildDeps();
}

function buildCheckers(directiveSyntax: DirectiveSyntaxValue) {
    const {markupParser, serializer} = buildDeps(directiveSyntax);
    return createMarkupChecker({parser: markupParser, serializer});
}

const {schema, markupParser: parser, serializer} = buildDeps(undefined);

const {same} = createMarkupChecker({parser, serializer});

const {doc, p, file} = builders<'doc' | 'p' | 'file'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    file: {nodeType: yfmFileNodeName},
});

const defaultAttrs = {
    [YfmFileAttr.Link]: 'path/to/readme',
    [YfmFileAttr.Name]: 'readme.md',
    [YfmFileAttr.Lang]: null,
    [YfmFileAttr.ReferrerPolicy]: null,
    [YfmFileAttr.Rel]: null,
    [YfmFileAttr.Target]: null,
    [YfmFileAttr.Type]: null,
    [YfmFileAttr.Markup]: '{% file ',
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
                        [YfmFileAttr.Link]: 'path/to/readme',
                        [YfmFileAttr.Name]: 'readme.md',
                        [YfmFileAttr.Lang]: 'ru',
                        [YfmFileAttr.ReferrerPolicy]: 'origin',
                        [YfmFileAttr.Rel]: 'help',
                        [YfmFileAttr.Target]: '_top',
                        [YfmFileAttr.Type]: 'text/markdown',
                        [YfmFileAttr.Markup]: '{% file ',
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

    describe('directiveSyntax', () => {
        const MARKUP = {
            CurlySyntax: dd`
            {% file src="path/to/readme.md" name="README.md" lang="ru" referrerpolicy="origin" rel="help" target="_top" type="text/markdown" %}
            `,

            DirectiveSyntax: dd`
            :file[README.md](path/to/readme.md){referrerpolicy="origin" rel="help" target="_top" type="text/markdown" hreflang="ru"}
            `,
        };

        const ATTRS = {
            [YfmFileAttr.Name]: 'README.md',
            [YfmFileAttr.Link]: 'path/to/readme.md',
            [YfmFileAttr.ReferrerPolicy]: 'origin',
            [YfmFileAttr.Rel]: 'help',
            [YfmFileAttr.Target]: '_top',
            [YfmFileAttr.Type]: 'text/markdown',
            [YfmFileAttr.Lang]: 'ru',
        };

        const PM_DOC = {
            CurlyFile: doc(
                p(
                    file({
                        ...ATTRS,
                        [YfmFileAttr.Markup]: '{% file ',
                    }),
                ),
            ),
            UnknownFile: doc(p(file({...ATTRS}))),
            DirectiveFile: doc(
                p(
                    file({
                        ...ATTRS,
                        [YfmFileAttr.Markup]: ':file',
                    }),
                ),
            ),
        };

        describe('directiveSyntax:disabled', () => {
            it('should parse curly syntax', () => {
                const {parse} = buildCheckers('disabled');
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyFile, {json: true});
            });

            it('should not parse directive syntax', () => {
                const {parse} = buildCheckers('disabled');
                parse(MARKUP.DirectiveSyntax, doc(p(MARKUP.DirectiveSyntax)), {json: true});
            });

            it('should preserve curly syntax', () => {
                const {serialize} = buildCheckers('disabled');
                serialize(PM_DOC.CurlyFile, MARKUP.CurlySyntax);
            });

            it('should serialize block with unknown markup to curly syntax', () => {
                const {serialize} = buildCheckers('disabled');
                serialize(PM_DOC.UnknownFile, MARKUP.CurlySyntax);
            });

            it('should preserve directive syntax', () => {
                const {serialize} = buildCheckers('disabled');
                serialize(PM_DOC.DirectiveFile, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:enabled', () => {
            it('should parse curly syntax', () => {
                const {parse} = buildCheckers('enabled');
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyFile, {json: true});
            });

            it('should parse directive syntax', () => {
                const {parse} = buildCheckers('enabled');
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveFile, {json: true});
            });

            it('should preserve curly syntax', () => {
                const {serialize} = buildCheckers('enabled');
                serialize(PM_DOC.CurlyFile, MARKUP.CurlySyntax);
            });

            it('should serialize block with unknown markup to curly syntax', () => {
                const {serialize} = buildCheckers('enabled');
                serialize(PM_DOC.UnknownFile, MARKUP.CurlySyntax);
            });

            it('should preserve directive syntax', () => {
                const {serialize} = buildCheckers('enabled');
                serialize(PM_DOC.DirectiveFile, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:preserve', () => {
            it('should parse curly syntax', () => {
                const {parse} = buildCheckers('preserve');
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyFile, {json: true});
            });

            it('should parse directive syntax', () => {
                const {parse} = buildCheckers('preserve');
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveFile, {json: true});
            });

            it('should preserve curly syntax', () => {
                const {serialize} = buildCheckers('preserve');
                serialize(PM_DOC.CurlyFile, MARKUP.CurlySyntax);
            });

            it('should serialize block with unknown markup to directive syntax', () => {
                const {serialize} = buildCheckers('preserve');
                serialize(PM_DOC.UnknownFile, MARKUP.DirectiveSyntax);
            });

            it('should preserve directive syntax', () => {
                const {serialize} = buildCheckers('preserve');
                serialize(PM_DOC.DirectiveFile, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:overwrite', () => {
            it('should parse curly syntax', () => {
                const {parse} = buildCheckers('overwrite');
                parse(MARKUP.CurlySyntax, PM_DOC.CurlyFile, {json: true});
            });

            it('should parse directive syntax', () => {
                const {parse} = buildCheckers('overwrite');
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveFile, {json: true});
            });

            it('should overwrite curly to directive syntax', () => {
                const {serialize} = buildCheckers('overwrite');
                serialize(PM_DOC.CurlyFile, MARKUP.DirectiveSyntax);
            });

            it('should serialize block with unknown markup to directive syntax', () => {
                const {serialize} = buildCheckers('overwrite');
                serialize(PM_DOC.UnknownFile, MARKUP.DirectiveSyntax);
            });

            it('should preserve directive syntax', () => {
                const {serialize} = buildCheckers('overwrite');
                serialize(PM_DOC.DirectiveFile, MARKUP.DirectiveSyntax);
            });
        });

        describe('directiveSyntax:only', () => {
            it('should not parse curly syntax', () => {
                const {parse} = buildCheckers('only');
                parse(MARKUP.CurlySyntax, doc(p(MARKUP.CurlySyntax)), {json: true});
            });

            it('should parse directive syntax', () => {
                const {parse} = buildCheckers('only');
                parse(MARKUP.DirectiveSyntax, PM_DOC.DirectiveFile, {json: true});
            });

            it('should overwrite curly to directive syntax', () => {
                const {serialize} = buildCheckers('only');
                serialize(PM_DOC.CurlyFile, MARKUP.DirectiveSyntax);
            });

            it('should serialize block with unknown markup to directive syntax', () => {
                const {serialize} = buildCheckers('only');
                serialize(PM_DOC.UnknownFile, MARKUP.DirectiveSyntax);
            });

            it('should preserve directive syntax', () => {
                const {serialize} = buildCheckers('only');
                serialize(PM_DOC.DirectiveFile, MARKUP.DirectiveSyntax);
            });
        });
    });
});
