export type {ExtensionsOptions} from './wysiwyg-preset';
export type {Editor, EditorType as YfmEditorType, RenderPreview, SplitMode} from './Editor';
export * from './context';
export * from './useYfmEditor';
export * from './YfmEditorView';

// For project that do not support star export (export * as something from '...')
import * as markupToolbarConfigs from './config/markup';
import * as wysiwygToolbarConfigs from './config/wysiwyg';
export {markupToolbarConfigs, wysiwygToolbarConfigs};
export {HorizontalDrag} from './HorizontalDrag';
