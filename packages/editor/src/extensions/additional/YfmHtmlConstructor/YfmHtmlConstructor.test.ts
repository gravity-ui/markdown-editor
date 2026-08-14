import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../specs';

import {YfmHtmlConstructorSpecs} from './YfmHtmlConstructorSpecs';
import {YfmHtmlConstructorAttrs, yfmHtmlConstructorNodeName} from './YfmHtmlConstructorSpecs/const';
import {HTML_CONSTRUCTOR_VARIABLES_CSS} from './cssVariables';

/** Matches the 2-space indentation `buildYfmHtmlConstructorHtml` applies inside `<style>`. */
const indentedContractCss = HTML_CONSTRUCTOR_VARIABLES_CSS.split('\n').map((line) =>
    line ? `  ${line}` : line,
);

const {schema, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(YfmHtmlConstructorSpecs, {}),
}).buildDeps();

const {doc, yfmHtmlConstructor} = builders<'doc' | 'yfmHtmlConstructor'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    yfmHtmlConstructor: {nodeType: yfmHtmlConstructorNodeName},
});

describe('YfmHtmlConstructor extension', () => {
    it('should serialize structure and blocks with g-md-hc wrappers', () => {
        expect(
            serializer.serialize(
                doc(
                    yfmHtmlConstructor({
                        [YfmHtmlConstructorAttrs.structure]: {
                            content: '<section>Intro</section>',
                            css: '',
                            themeIds: [],
                        },
                        [YfmHtmlConstructorAttrs.blocks]: [
                            {
                                id: 'block-1',
                                css: '',
                                content: '<strong>First</strong>',
                                themeIds: [],
                            },
                        ],
                        [YfmHtmlConstructorAttrs.EntityId]: 'yfm_html_constructor-1',
                    }),
                ),
            ),
        ).toBe(
            [
                '::: html',
                '<div id="g-md-hc-structure-1" class="g-md-hc-structure g-md-hc-structure-1">',
                '  <section>Intro</section>',
                '  <div id="g-md-hc-block-1" class="g-md-hc-block g-md-hc-block-1"><strong>First</strong></div>',
                '</div>',
                ':::',
            ].join('\n'),
        );
    });

    it('should emit structure, structure-theme, block and block-theme css into a style tag', () => {
        expect(
            serializer.serialize(
                doc(
                    yfmHtmlConstructor({
                        [YfmHtmlConstructorAttrs.structure]: {
                            content: '',
                            css: ['& { display: grid; }', '.g-md-hc-structure { gap: 12px; }'].join(
                                '\n\n',
                            ),
                            themeIds: ['structure-theme'],
                        },
                        [YfmHtmlConstructorAttrs.blocks]: [
                            {
                                id: 'block-1',
                                css: [
                                    '& { padding: 12px; }',
                                    '.g-md-hc-block { color: red; }',
                                ].join('\n\n'),
                                content: 'First',
                                themeIds: ['block-theme'],
                            },
                        ],
                        [YfmHtmlConstructorAttrs.EntityId]: 'yfm_html_constructor-1',
                    }),
                ),
            ),
        ).toBe(
            [
                '::: html',
                '<style>',
                ...indentedContractCss,
                '  .g-md-hc-structure.g-md-hc-structure-1 { display: grid; }',
                '  .g-md-hc-structure { gap: 12px; }',
                '  .g-md-hc-block.g-md-hc-block-1 { padding: 12px; }',
                '  .g-md-hc-block { color: red; }',
                '</style>',
                '<div id="g-md-hc-structure-1" class="g-md-hc-structure g-md-hc-structure-1">',
                '  <div id="g-md-hc-block-1" class="g-md-hc-block g-md-hc-block-1">First</div>',
                '</div>',
                ':::',
            ].join('\n'),
        );
    });
});
