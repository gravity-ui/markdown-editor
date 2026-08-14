import {parseTemplates} from '../templates';

import {buildBlockMenuGroups, buildStructureMenuGroups} from './groupTemplates';

const constructorTemplates = () =>
    parseTemplates(`
        <template type="family" id="family-a" title="Family A"></template>
        <template type="structure" id="structure-a" title="Structure A" family="family-a"></template>
        <template type="block" id="block-1" title="Block 1" structure="structure-a" family="family-a"></template>
        <template type="block" id="block-2" title="Block 2" structure="structure-a" family="family-a"></template>
        <template type="block" id="block-3" title="Block 3" structure="structure-a" family="family-a"></template>
        <template type="block" id="block-4" title="Block 4" structure="structure-a" family="family-a"></template>
        <template type="block" id="block-5" title="Block 5" structure="structure-a" family="family-a"></template>
        <template type="block" id="block-6" title="Block 6" structure="structure-a" family="family-a"></template>
        <template type="theme" id="structure-theme-1" title="Structure theme 1" structure="structure-a" family="family-a"></template>
        <template type="theme" id="structure-theme-2" title="Structure theme 2" structure="structure-a" family="family-a"></template>
        <template type="theme" id="structure-theme-3" title="Structure theme 3" structure="structure-a" family="family-a"></template>
        <template type="theme" id="structure-theme-4" title="Structure theme 4" structure="structure-a" family="family-a"></template>
        <template type="theme" id="block-2-theme" title="Block 2 theme" block="block-2" family="family-a"></template>
        <template type="block" id="block-7" title="Block 7" block="block-3" family="family-a"></template>
    `);

describe('HTML Constructor template menus', () => {
    it('groups one structure with four structure themes by family', () => {
        expect(buildStructureMenuGroups(constructorTemplates())).toEqual([
            {
                familyId: 'family-a',
                title: 'Family A',
                items: [
                    {
                        structure: expect.objectContaining({id: 'structure-a'}),
                        themes: [
                            expect.objectContaining({id: 'structure-theme-1'}),
                            expect.objectContaining({id: 'structure-theme-2'}),
                            expect.objectContaining({id: 'structure-theme-3'}),
                            expect.objectContaining({id: 'structure-theme-4'}),
                        ],
                    },
                ],
            },
        ]);
    });

    it('groups six base blocks by family for the active structure', () => {
        const groups = buildBlockMenuGroups(constructorTemplates(), 'structure-a');

        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({familyId: 'family-a', title: 'Family A'});
        expect(groups[0]?.items.map((item) => item.block.id)).toEqual([
            'block-1',
            'block-2',
            'block-3',
            'block-4',
            'block-5',
            'block-6',
        ]);
    });

    it('attaches block themes and block states to their base block', () => {
        const groups = buildBlockMenuGroups(constructorTemplates(), 'structure-a');
        const block2 = groups[0]?.items.find((item) => item.block.id === 'block-2');
        const block3 = groups[0]?.items.find((item) => item.block.id === 'block-3');

        expect(block2?.themesByBlockId['block-2']).toEqual([
            expect.objectContaining({id: 'block-2-theme'}),
        ]);
        expect(block3?.states.map((state) => state.id)).toEqual(['block-3', 'block-7']);
    });

    it('filters by family, block, state or theme title', () => {
        expect(
            buildBlockMenuGroups(constructorTemplates(), 'structure-a', 'Block 7')[0]?.items,
        ).toEqual([expect.objectContaining({block: expect.objectContaining({id: 'block-3'})})]);
        expect(
            buildStructureMenuGroups(constructorTemplates(), 'Structure theme 3')[0]?.items[0]
                ?.themes,
        ).toEqual(expect.arrayContaining([expect.objectContaining({id: 'structure-theme-3'})]));
    });
});
