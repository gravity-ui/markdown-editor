import {ToolbarName} from '../../../modules/toolbars/constants';
import type {ContextualToolbarsConfig} from '../../../modules/toolbars/contextual';
import {commonmark, defaultPreset, full, yfm, zero} from '../../../modules/toolbars/presets';
import type {
    ToolbarItem,
    ToolbarItemMarkup,
    ToolbarItemWysiwyg,
    ToolbarsPreset,
} from '../../../modules/toolbars/types';
import type {MarkdownEditorPreset} from '../../preset-base-types';
import {ToolbarDataType} from '../types';
import type {
    MToolbarData,
    ToolbarConfigs,
    ToolbarIconData,
    WToolbarData,
    WToolbarItemData,
} from '../types';

import {flattenPreset} from './flattenPreset';

const defaultPresets: Record<MarkdownEditorPreset, ToolbarsPreset> = {
    zero,
    commonmark,
    default: defaultPreset,
    yfm,
    full,
};

interface TransformedItem {
    type: ToolbarDataType;
    id: string;
    className?: string;
    aliases?: string[];
    title?: string | (() => string);
    hint?: string | (() => string);
    icon?: ToolbarIconData;
    hotkey?: string;
    withArrow?: boolean;
    replaceActiveIcon?: true;
    doNotActivateList?: boolean;
    preview?: React.ReactNode;
    wysiwyg?: ToolbarItemWysiwyg<ToolbarDataType>;
    markup?: ToolbarItemMarkup<ToolbarDataType>;
}

const transformItem = (
    type: 'wysiwyg' | 'markup',
    item?: ToolbarItem<ToolbarDataType.SingleButton | ToolbarDataType.ListButton>,
    id = 'unknown',
): TransformedItem => {
    if (!item) {
        console.warn(
            `Toolbar item "${id}" not found, it might not have been added to the items dictionary.`,
        );
        return {} as TransformedItem;
    }

    const isListButton = item.view.type === ToolbarDataType.ListButton;
    const isSingleButton = item.view.type === ToolbarDataType.SingleButton;

    return {
        type: item.view.type ?? ToolbarDataType.SingleButton,
        id,
        className: item.view.className,
        aliases: item.view.aliases,
        title: item.view.title,
        hint: item.view.hint,
        icon: item.view.icon,
        hotkey: item.view.hotkey,
        doNotActivateList: item.view.doNotActivateList,
        ...((isSingleButton || !item.view.type) && {preview: (item.view as any).preview}),
        ...(isListButton && {
            withArrow: (item.view as any).withArrow,
            replaceActiveIcon: (item.view as any).replaceActiveIcon,
        }),
        ...(type === 'wysiwyg' && item.wysiwyg && {...item.wysiwyg}),
        ...(type === 'markup' && item.markup && {...item.markup}),
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
    createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygSlash)
        .flatMap((group) =>
            group.flatMap((item): WToolbarItemData[] => {
                if (item.type === ToolbarDataType.ListButton) return item.data;
                if (item.type === ToolbarDataType.SingleButton) return [item];
                return [];
            }),
        )
        .filter((item) => typeof item.exec === 'function' && typeof item.isEnable === 'function');

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
