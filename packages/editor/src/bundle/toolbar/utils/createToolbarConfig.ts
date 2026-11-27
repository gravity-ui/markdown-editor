import {ToolbarDataType} from 'src/bundle/toolbar/types';
import type {MToolbarData, WToolbarData, WToolbarItemData} from 'src/bundle/toolbar/types';
import {flattenPreset} from 'src/bundle/toolbar/utils/flattenPreset';
import type {ContextualToolbarsConfig} from 'src/extensions/behavior/ContextualToolbars';
import {ToolbarName} from 'src/modules/toolbars/constants';
import type {ToolbarItem, ToolbarsPreset} from 'src/modules/toolbars/types';

/** @internal */
export const createToolbarConfig = <T extends WToolbarData | MToolbarData>(
    editorType: 'wysiwyg' | 'markup',
    preset: ToolbarsPreset,
    toolbarName: string,
): T => {
    const orders = preset.orders[toolbarName] ?? [[]];
    const {items} = preset;

    const toolbarData = orders.map((group) =>
        group.map((action) => {
            return typeof action === 'string'
                ? transformItem(editorType, items[action], action)
                : {
                      ...transformItem(editorType, items[action.id], action.id),
                      data: action.items.map((id) => transformItem(editorType, items[id], id)),
                  };
        }),
    );

    return toolbarData as T;
};

/** @internal */
export const createSelectionToolbarConfig = (preset: ToolbarsPreset): WToolbarData =>
    createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygSelection).map(
        (group) =>
            group.map((item) =>
                item.type === ToolbarDataType.ReactComponent
                    ? {...item, props: {disablePortal: true, ...item.props}}
                    : item,
            ),
    );

/** @internal */
export const createSlashToolbarConfig = (preset: ToolbarsPreset): WToolbarItemData[] =>
    flattenPreset(
        createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygSlash),
    ).filter(
        (item) =>
            'type' in item &&
            item.type === ToolbarDataType.SingleButton &&
            typeof item.exec === 'function' &&
            typeof item.isEnable === 'function',
    );

/** @internal */
export const getContextualToolbarsConfig = (preset?: ToolbarsPreset): ContextualToolbarsConfig => ({
    selection: preset?.orders[ToolbarName.wysiwygSelection]
        ? createSelectionToolbarConfig(preset)
        : undefined,
    slash: preset?.orders[ToolbarName.wysiwygSlash] ? createSlashToolbarConfig(preset) : undefined,
});

function transformItem(
    type: 'wysiwyg' | 'markup',
    item?: ToolbarItem<ToolbarDataType>,
    id = 'unknown',
) {
    if (!item) {
        console.warn(
            `Toolbar item "${id}" not found, it might not have been added to the items dictionary.`,
        );
        return {};
    }

    return {
        ...item.view,
        type: item.view.type ?? ToolbarDataType.SingleButton,
        id,
        ...item[type],
    };
}
