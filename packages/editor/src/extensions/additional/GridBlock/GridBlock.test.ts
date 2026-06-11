import {builders} from 'prosemirror-test-builder';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../specs';

import {GridBlockAttrs, gridBlockNodeName} from './GridBlockSpecs/const';
import {GridBlockSpecs} from './GridBlockSpecs';

const {schema, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(GridBlockSpecs, {}),
}).buildDeps();

const {doc, gridBlock} = builders<'doc' | 'gridBlock'>(schema, {
    doc: {nodeType: BaseNode.Doc},
    gridBlock: {nodeType: gridBlockNodeName},
});

describe('GridBlock extension', () => {
    it('should serialize to yfm html block', () => {
        expect(
            serializer.serialize(
                doc(
                    gridBlock({
                        [GridBlockAttrs.blocks]: [
                            {
                                id: 'block-1',
                                css: 'padding: 12px;',
                                text: 'First',
                            },
                        ],
                        [GridBlockAttrs.containerCss]: 'display: grid;',
                        [GridBlockAttrs.EntityId]: 'grid_block-1',
                    }),
                ),
            ),
        ).toBe(
            [
                '::: html',
                '<div class="grid" style="display: grid;">',
                '  <div class="block-1" style="padding: 12px;">First</div>',
                '</div>',
                ':::',
            ].join('\n'),
        );
    });
});
