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
    it('should serialize to yfm html block', () => {
        expect(
            serializer.serialize(
                doc(
                    gridBlockTemplates({
                        [GridBlockTemplatesAttrs.blocks]: [
                            {
                                id: 'block-1',
                                css: 'padding: 12px;',
                                content: '<strong>First</strong>',
                            },
                        ],
                        [GridBlockTemplatesAttrs.containerCss]: 'display: grid;',
                        [GridBlockTemplatesAttrs.EntityId]: 'grid_block_templates-1',
                    }),
                ),
            ),
        ).toBe(
            [
                '::: html',
                '<div class="grid" style="display: grid;">',
                '  <div class="block-1" style="padding: 12px;"><strong>First</strong></div>',
                '</div>',
                ':::',
            ].join('\n'),
        );
    });
});
