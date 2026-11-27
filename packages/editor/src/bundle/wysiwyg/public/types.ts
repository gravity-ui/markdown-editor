import type {ProviderProps} from 'react';

import type {CommonEditor} from 'src/common';
import type {Receiver} from 'src/utils/event-emitter';

import type {MarkdownEditorInstance} from '../../editor-public-types';
import type {EventMap} from '../../events';
import type {
    MarkdownEditorExperimentalOptions,
    MarkdownEditorInitialOptions,
    MarkdownEditorOptions,
} from '../../types';

export interface MarkdownWysiwygEditorOptions extends Pick<
    MarkdownEditorOptions,
    'preset' | 'md' | 'handlers' | 'config' | 'logger' | 'mobile' | 'wysiwygConfig'
> {
    /** Initial Markdown and toolbar state. Defaults to empty text and a visible toolbar. */
    initial?: Pick<MarkdownEditorInitialOptions, 'markup' | 'toolbarVisible'>;
    /** Optional WYSIWYG behavior flags. Unset by default. */
    experimental?: Omit<
        MarkdownEditorExperimentalOptions,
        'beforeEditorModeChange' | 'prepareRawMarkup'
    >;
}

export interface MarkdownEditorCommonEvents extends Pick<
    EventMap,
    'change' | 'cancel' | 'submit' | 'toolbar-action' | 'change-toolbar-visibility'
> {}

export interface MarkdownWysiwygEditorEvents extends MarkdownEditorCommonEvents {
    'toolbar-action': Omit<EventMap['toolbar-action'], 'editorMode'> & {editorMode: 'wysiwyg'};
}

export interface MarkdownWysiwygEditorInstance
    extends
        Pick<MarkdownEditorInstance, keyof CommonEditor | 'logger' | 'toolbarVisible'>,
        Receiver<MarkdownWysiwygEditorEvents> {}

export type MarkdownWysiwygEditorProviderProps =
    ProviderProps<MarkdownWysiwygEditorInstance | null>;
