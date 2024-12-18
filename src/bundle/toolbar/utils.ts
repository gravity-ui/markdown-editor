import {ToolbarName} from '../../modules/toolbars/constants';
import {commonmark, defaultPreset, full, yfm, zero} from '../../modules/toolbars/presets';
import {
    EditorPreset,
    ToolbarItem,
    ToolbarsPresetOrEditorPreset,
} from '../../modules/toolbars/types';
import {
    MToolbarData,
    MToolbarItemData,
    ToolbarDataType,
    WToolbarData,
    WToolbarItemData,
} from '../../toolbar';
import {MarkdownEditorViewProps} from '../MarkdownEditorView';

const defaultPresets = {
    zero,
    commonmark,
    default: defaultPreset,
    yfm,
    full,
};

const transformItem = (
    type: 'wysiwyg' | 'markup',
    item?: ToolbarItem<ToolbarDataType.SingleButton | ToolbarDataType.ListButton>,
    id = 'unknown',
) => {
    console.log('item', item, id);

    if (!item) {
        console.warn(
            `Toolbar item "${id}" not found, it might not have been added to the items dictionary.`,
        );
        return {};
    }

    const isListButton = item.view.type === ToolbarDataType.ListButton;

    return {
        type: item.view.type || 's-button',
        id,
        title: item.view.title,
        hint: item.view.hint,
        icon: item.view.icon,
        hotkey: item.view.hotkey,
        ...(isListButton && {withArrow: (item.view as any).withArrow}),
        ...(type === 'wysiwyg' && item.wysiwyg && {...item.wysiwyg}),
        ...(type === 'markup' && item.markup && {...item.markup}),
    };
};

export const createConfig = <T extends WToolbarData | MToolbarData>(
    editorType: 'wysiwyg' | 'markup',
    toolbarPreset: ToolbarsPresetOrEditorPreset,
    toolbarName: string,
): T => {
    const preset =
        typeof toolbarPreset === 'string' ? getDefaultPresetByName(toolbarPreset) : toolbarPreset;
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

const getDefaultPresetByName = (initialPreset: EditorPreset) => {
    const presetName = ['zero', 'commonmark', 'default', 'yfm', 'full'].includes(initialPreset)
        ? initialPreset
        : 'default';
    return defaultPresets[presetName];
};

const flattenPreset = <T extends WToolbarData | MToolbarData>(config: T) => {
    // TODO: @makhnatkin add logic for flatten
    return (config[0] ?? []) as unknown as T extends WToolbarData
        ? WToolbarItemData[]
        : MToolbarItemData[];
};

interface GetToolbarsConfigsArgs {
    toolbarsPreset?: ToolbarsPresetOrEditorPreset;
    props: MarkdownEditorViewProps;
    preset: EditorPreset;
}
export const getToolbarsConfigs = ({toolbarsPreset, props, preset}: GetToolbarsConfigsArgs) => {
    const wysiwygToolbarConfig = toolbarsPreset
        ? createConfig<WToolbarData>('wysiwyg', toolbarsPreset, ToolbarName.wysiwygMain)
        : props.wysiwygToolbarConfig ??
          createConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygMain);

    const markupToolbarConfig = toolbarsPreset
        ? createConfig<MToolbarData>('markup', toolbarsPreset, ToolbarName.markupMain)
        : props.markupToolbarConfig ??
          createConfig<MToolbarData>('markup', preset, ToolbarName.markupMain);

    const wysiwygHiddenActionsConfig = toolbarsPreset
        ? flattenPreset(
              createConfig<WToolbarData>('wysiwyg', toolbarsPreset, ToolbarName.wysiwygHidden),
          )
        : props.wysiwygHiddenActionsConfig ??
          flattenPreset(createConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygHidden));

    const markupHiddenActionsConfig = toolbarsPreset
        ? flattenPreset(
              createConfig<MToolbarData>('markup', toolbarsPreset, ToolbarName.markupHidden),
          )
        : props.markupHiddenActionsConfig ??
          flattenPreset(createConfig<MToolbarData>('markup', preset, ToolbarName.markupHidden));

    return {
        wysiwygToolbarConfig,
        markupToolbarConfig,
        wysiwygHiddenActionsConfig,
        markupHiddenActionsConfig,
    };
};
