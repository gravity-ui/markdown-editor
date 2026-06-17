import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../specs';

import {GridBlockTemplatesSpecs} from './GridBlockTemplatesSpecs';
import {GridBlockTemplatesAttrs, gridBlockTemplatesNodeName} from './GridBlockTemplatesSpecs/const';

const {schema, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(GridBlockTemplatesSpecs, {}),
}).buildDeps();

const {doc, gridBlockTemplates} = builders<'doc' | 'gridBlockTemplates'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    gridBlockTemplates: {nodeType: gridBlockTemplatesNodeName},
});

describe('GridBlockTemplates extension', () => {
    it('should serialize blocks without inline styles', () => {
        expect(
            serializer.serialize(
                doc(
                    gridBlockTemplates({
                        [GridBlockTemplatesAttrs.blocks]: [
                            {id: 'block-1', css: '', content: '<strong>First</strong>'},
                        ],
                        [GridBlockTemplatesAttrs.EntityId]: 'grid_block_templates-1',
                    }),
                ),
            ),
        ).toBe(
            [
                '::: html',
                '<div class="grid-templates-scope-grid_block_templates-1">',
                '  <div class="grid">',
                '    <div class="block-1"><strong>First</strong></div>',
                '  </div>',
                '</div>',
                ':::',
            ].join('\n'),
        );
    });

    it('should emit scoped container and per-block css into a style tag', () => {
        expect(
            serializer.serialize(
                doc(
                    gridBlockTemplates({
                        [GridBlockTemplatesAttrs.blocks]: [
                            {
                                id: 'block-1',
                                css: '& { padding: 12px; }\nh3 { margin: 0; }',
                                content: 'First',
                            },
                        ],
                        [GridBlockTemplatesAttrs.customCss]: '.grid { align-items: center; }',
                        [GridBlockTemplatesAttrs.EntityId]: 'grid_block_templates-1',
                    }),
                ),
            ),
        ).toBe(
            [
                '::: html',
                '<div class="grid-templates-scope-grid_block_templates-1">',
                '  <style>',
                '    .grid-templates-scope-grid_block_templates-1 .grid { align-items: center; }',
                '    .grid-templates-scope-grid_block_templates-1 .block-1 { padding: 12px; }',
                '    .grid-templates-scope-grid_block_templates-1 .block-1 h3 { margin: 0; }',
                '  </style>',
                '  <div class="grid">',
                '    <div class="block-1">First</div>',
                '  </div>',
                '</div>',
                ':::',
            ].join('\n'),
        );
    });
});
