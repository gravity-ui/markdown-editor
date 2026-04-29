import type {EditorView as PMEditorView} from 'prosemirror-view';

import type {CommonEditor} from '../common';
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
    setEditorMode(mode: MarkdownEditorMode, opts?: Pick<ChangeEditorModeOptions, 'emit'>): void;
    moveCursor(position: 'start' | 'end' | {line: number}): void;
    /** @internal used in demo for dev-tools */
    readonly _wysiwygView?: PMEditorView;
}
