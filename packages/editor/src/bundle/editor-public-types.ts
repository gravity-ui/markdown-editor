import type {EditorView as PMEditorView} from 'prosemirror-view';

import type {CommonEditor, MarkupString} from '../common';
import type {Logger2} from '../logger';
import type {Receiver} from '../utils';

import type {EventMap} from './events';
import type {MarkdownEditorMode} from './preset-base-types';

export type ChangeEditorModeOptions = {
    mode: MarkdownEditorMode;
    reason: 'error-boundary' | 'settings' | 'manually';
    emit?: boolean;
};

export interface MarkdownEditorInstance extends Receiver<EventMap>, CommonEditor {
    readonly logger: Logger2.LogReceiver;
    readonly currentMode: MarkdownEditorMode;
    readonly toolbarVisible: boolean;
    /** Whether the full-screen markup preview is currently visible. */
    readonly previewVisible: boolean;
    setEditorMode(mode: MarkdownEditorMode, opts?: Pick<ChangeEditorModeOptions, 'emit'>): void;
    moveCursor(position: 'start' | 'end' | {line: number}): void;
    insert(markup: MarkupString): void;
    /**
     * Control the full-screen markup preview.
     * Pass `true`/`false` to explicitly show/hide it, or call with no argument to toggle.
     * No-op if `renderPreview` is not configured or split mode is currently enabled.
     */
    changePreviewVisible(visible?: boolean): void;
    /** @internal used in demo for dev-tools */
    readonly _wysiwygView?: PMEditorView;
}
