import type {ModeCoreOptions} from '../shared/types';
import type {MarkdownEditorOptions} from '../types';

/** @internal */
export type MarkupCoreOptions = ModeCoreOptions & Pick<MarkdownEditorOptions, 'markupConfig'>;
