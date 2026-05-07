import type {MarkdownEditorMode} from './preset-base-types';

export type ToolbarActionData = {
    editorMode: MarkdownEditorMode;
    id: string;
    attrs?: {[key: string]: any};
};

export interface EventMap {
    change: null;
    cancel: null;
    submit: null;

    'toolbar-action': ToolbarActionData;

    'change-editor-mode': {mode: MarkdownEditorMode};
    'change-toolbar-visibility': {visible: boolean};
    'change-split-mode-enabled': {splitModeEnabled: boolean};
}
