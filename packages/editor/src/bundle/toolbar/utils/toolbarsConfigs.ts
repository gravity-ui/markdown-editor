import {ToolbarName} from '../../../modules/toolbars/constants';
import {commonmark, defaultPreset, full, yfm, zero} from '../../../modules/toolbars/presets';
import type {ToolbarsPreset} from '../../../modules/toolbars/types';
import type {MarkdownEditorPreset} from '../../preset-base-types';
import type {MToolbarData, ToolbarConfigs, WToolbarData, WToolbarItemData} from '../types';

import {
    createToolbarConfig as createConfig,
    createSelectionToolbarConfig as createSelectionConfig,
    createSlashToolbarConfig as createSlashConfig,
} from './createToolbarConfig';
import {flattenPreset} from './flattenPreset';

export {getContextualToolbarsConfig} from './createToolbarConfig';

const defaultPresets: Record<MarkdownEditorPreset, ToolbarsPreset> = {
    zero,
    commonmark,
    default: defaultPreset,
    yfm,
    full,
};

export const createToolbarConfig = <T extends WToolbarData | MToolbarData>(
    editorType: 'wysiwyg' | 'markup',
    toolbarPreset: ToolbarsPreset | MarkdownEditorPreset,
    toolbarName: string,
): T => createConfig<T>(editorType, resolvePreset(toolbarPreset), toolbarName);

export const createSelectionToolbarConfig = (
    preset: ToolbarsPreset | MarkdownEditorPreset,
): WToolbarData => createSelectionConfig(resolvePreset(preset));
export const createSlashToolbarConfig = (
    preset: ToolbarsPreset | MarkdownEditorPreset,
): WToolbarItemData[] => createSlashConfig(resolvePreset(preset));

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

function resolvePreset(preset: ToolbarsPreset | MarkdownEditorPreset): ToolbarsPreset {
    return typeof preset === 'string' ? defaultPresets[preset] || defaultPresets.default : preset;
}
