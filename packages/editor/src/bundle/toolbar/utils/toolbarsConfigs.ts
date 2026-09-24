import {ToolbarName} from '../../../modules/toolbars/constants';
import type {ContextualToolbarsConfig} from '../../../modules/toolbars/contextual';
import {commonmark, defaultPreset, full, yfm, zero} from '../../../modules/toolbars/presets';
import type {ToolbarItem, ToolbarsPreset} from '../../../modules/toolbars/types';
import type {MarkdownEditorPreset} from '../../preset-base-types';
import {ToolbarDataType} from '../types';
import type {MToolbarData, ToolbarConfigs, WToolbarData, WToolbarItemData} from '../types';

import {flattenPreset} from './flattenPreset';

const defaultPresets: Record<MarkdownEditorPreset, ToolbarsPreset> = {
    zero,
    commonmark,
    default: defaultPreset,
    yfm,
    full,
};

const transformItem = (
    type: 'wysiwyg' | 'markup',
    item?: ToolbarItem<ToolbarDataType>,
    id = 'unknown',
) => {
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
};

export const createToolbarConfig = <T extends WToolbarData | MToolbarData>(
    editorType: 'wysiwyg' | 'markup',
    toolbarPreset: ToolbarsPreset | MarkdownEditorPreset,
    toolbarName: string,
): T => {
    const preset =
        typeof toolbarPreset === 'string'
            ? defaultPresets[toolbarPreset] || defaultPresets.default
            : toolbarPreset;
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

export const createSelectionToolbarConfig = (
    preset: ToolbarsPreset | MarkdownEditorPreset,
): WToolbarData =>
    createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygSelection).map(
        (group) =>
            group.map((item) =>
                item.type === ToolbarDataType.ReactComponent
                    ? {...item, props: {disablePortal: true, ...item.props}}
                    : item,
            ),
    );

export const createSlashToolbarConfig = (
    preset: ToolbarsPreset | MarkdownEditorPreset,
): WToolbarItemData[] =>
    flattenPreset(
        createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygSlash),
    ).filter(
        (item) =>
            'type' in item &&
            item.type === ToolbarDataType.SingleButton &&
            typeof item.exec === 'function' &&
            typeof item.isEnable === 'function',
    );

export const getContextualToolbarsConfig = (preset?: ToolbarsPreset): ContextualToolbarsConfig => ({
    selection: preset?.orders[ToolbarName.wysiwygSelection]
        ? createSelectionToolbarConfig(preset)
        : undefined,
    slash: preset?.orders[ToolbarName.wysiwygSlash] ? createSlashToolbarConfig(preset) : undefined,
});

interface GetToolbarsConfigsArgs {
    toolbarsPreset?: ToolbarsPreset;
    props: ToolbarConfigs;
    preset: MarkdownEditorPreset;
}
export const getToolbarsConfigs = ({toolbarsPreset, props, preset}: GetToolbarsConfigsArgs) => {
    const wysiwygToolbarConfig = toolbarsPreset
        ? createToolbarConfig<WToolbarData>('wysiwyg', toolbarsPreset, ToolbarName.wysiwygMain)
        : (props.wysiwygToolbarConfig ??
          createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygMain));

    const markupToolbarConfig = toolbarsPreset
        ? createToolbarConfig<MToolbarData>('markup', toolbarsPreset, ToolbarName.markupMain)
        : (props.markupToolbarConfig ??
          createToolbarConfig<MToolbarData>('markup', preset, ToolbarName.markupMain));

    const wysiwygHiddenActionsConfig = toolbarsPreset
        ? flattenPreset(
              createToolbarConfig<WToolbarData>(
                  'wysiwyg',
                  toolbarsPreset,
                  ToolbarName.wysiwygHidden,
              ),
          )
        : (props.wysiwygHiddenActionsConfig ??
          flattenPreset(
              createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygHidden),
          ));

    const markupHiddenActionsConfig = toolbarsPreset
        ? flattenPreset(
              createToolbarConfig<MToolbarData>('markup', toolbarsPreset, ToolbarName.markupHidden),
          )
        : (props.markupHiddenActionsConfig ??
          flattenPreset(
              createToolbarConfig<MToolbarData>('markup', preset, ToolbarName.markupHidden),
          ));

    return {
        wysiwygToolbarConfig,
        markupToolbarConfig,
        wysiwygHiddenActionsConfig,
        markupHiddenActionsConfig,
    };
};
