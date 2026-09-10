import {filterActions} from '../../../extensions/behavior/CommandMenu/handler';
import {ActionName, ToolbarName} from '../../../modules/toolbars/constants';
import {textContextItemWisywig} from '../../../modules/toolbars/items';
import {commonmark, defaultPreset, full, yfm, zero} from '../../../modules/toolbars/presets';
import type {ToolbarsPreset} from '../../../modules/toolbars/types';
import {wCommandMenuConfigByPreset, wSelectionMenuConfigByPreset} from '../../config/wysiwyg';
import type {MarkdownEditorPreset} from '../../types';

import {
    createSelectionToolbarConfig,
    createSlashToolbarConfig,
    getContextualToolbarsConfig,
} from './toolbarsConfigs';

const presets = {zero, commonmark, default: defaultPreset, yfm, full};
const migratedIds: Record<string, string> = {
    'folding-heading': ActionName.foldingHeading,
    code_inline: ActionName.codeInline,
    code_block: ActionName.codeBlock,
    horizontalrule: ActionName.horizontalRule,
    yfm_note: ActionName.note,
    yfm_cut: ActionName.cut,
};
const migrateId = ({id}: {id: string}) => migratedIds[id] ?? id;

describe('Contextual toolbar presets', () => {
    it.each(Object.keys(presets) as MarkdownEditorPreset[])(
        'preserves the default selection and slash actions for %s',
        (preset) => {
            const selection = createSelectionToolbarConfig(preset);
            expect(selection.map((group) => group.map(({id}) => id))).toEqual(
                wSelectionMenuConfigByPreset[preset].map((group) => group.map(migrateId)),
            );
            expect(createSlashToolbarConfig(preset).map(({id}) => id)).toEqual(
                wCommandMenuConfigByPreset[preset].map(migrateId),
            );
        },
    );

    it('preserves heading aliases and previews in the slash toolbar', () => {
        const commands = createSlashToolbarConfig('full');
        for (let level = 1; level <= 6; level++) {
            const matches = filterActions(commands, `h${level}`);
            expect(matches).toHaveLength(1);
            expect(matches[0].id).toBe(`heading${level}`);
            expect(matches[0].preview).toBeDefined();
        }
    });

    it('flattens ordered lists and ignores components and markup-only actions in the slash toolbar', () => {
        const preset: ToolbarsPreset = {
            items: {
                ...full.items,
                markupOnly: {view: full.items.bold.view, markup: full.items.bold.markup},
            },
            orders: {
                [ToolbarName.wysiwygSlash]: [
                    [{id: 'heading', items: [ActionName.heading2, ActionName.heading1]}],
                    [ActionName.colorify, 'markupOnly', ActionName.paragraph],
                ],
            },
        };
        expect(createSlashToolbarConfig(preset).map(({id}) => id)).toEqual([
            ActionName.heading2,
            ActionName.heading1,
            ActionName.paragraph,
        ]);
    });

    it('distinguishes omitted contextual orders from explicitly empty toolbars', () => {
        expect(getContextualToolbarsConfig()).toEqual({selection: undefined, slash: undefined});
        expect(getContextualToolbarsConfig({items: {}, orders: {}})).toEqual({
            selection: undefined,
            slash: undefined,
        });
        expect(
            getContextualToolbarsConfig({
                items: {},
                orders: {
                    [ToolbarName.wysiwygSelection]: [],
                    [ToolbarName.wysiwygSlash]: [],
                },
            }),
        ).toEqual({selection: [], slash: []});
    });

    it('preserves selection conditions and custom component props', () => {
        expect(getContextualToolbarsConfig(full).selection?.[0][1]).toEqual(
            expect.objectContaining({props: {disablePortal: true}}),
        );
        const preset: ToolbarsPreset = {
            items: {
                ...full.items,
                text: {
                    ...full.items.text,
                    wysiwyg: {...textContextItemWisywig, props: {disablePortal: false}},
                },
            },
            orders: full.orders,
        };
        const config = getContextualToolbarsConfig(preset).selection;
        expect(config?.[0][0].condition).toBe('enabled');
        expect(config?.[0][1]).toEqual(
            expect.objectContaining({
                condition: expect.any(Function),
                props: {disablePortal: false},
            }),
        );
    });
});
