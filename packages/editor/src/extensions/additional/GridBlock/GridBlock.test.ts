import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../specs';

import {GridBlockSpecs} from './GridBlockSpecs';
import {GridBlockAttrs, gridBlockNodeName} from './GridBlockSpecs/const';

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

    it('should escape css and text in serialized html', () => {
        expect(
            serializer.serialize(
                doc(
                    gridBlock({
                        [GridBlockAttrs.blocks]: [
                            {id: 'block-1', css: 'font-family: "A&B";', text: '<b>x</b>'},
                        ],
                        [GridBlockAttrs.containerCss]: 'background: url("a.png");',
                        [GridBlockAttrs.EntityId]: 'grid_block-1',
                    }),
                ),
            ),
        ).toBe(
            [
                '::: html',
                '<div class="grid" style="background: url(&quot;a.png&quot;);">',
                '  <div class="block-1" style="font-family: &quot;A&amp;B&quot;;">&lt;b&gt;x&lt;/b&gt;</div>',
                '</div>',
                ':::',
            ].join('\n'),
        );
    });
});
