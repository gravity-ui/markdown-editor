import type {ModeCoreOptions} from '../shared/types';
import type {MarkdownEditorOptions} from '../types';

/** @internal */
export type WysiwygCoreOptions = ModeCoreOptions &
    Pick<MarkdownEditorOptions, 'md' | 'wysiwygConfig' | 'mobile'>;
