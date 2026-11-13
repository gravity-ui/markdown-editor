import type {CommonEditor, MarkupString} from 'src/common';
import type {Logger2} from 'src/logger';
import type {ReactRenderStorage} from 'src/modules/react-renderer';
import type {DirectiveSyntaxContext} from 'src/utils/directive';

import type {MarkdownEditorOptions, MarkdownEditorPreset} from '../types';

/** @internal */
export interface ModeCore<TEditor extends CommonEditor> {
    readonly editor: TEditor | undefined;
    getEditor(): TEditor;
    moveCursorToLine(line: number): void;
    destroy(): void;
}

/** @internal */
export type ModeCoreOptions = Pick<
    MarkdownEditorOptions,
    'config' | 'enableTabExitOnEscape' | 'experimental' | 'handlers'
> & {
    preset: MarkdownEditorPreset;
    logger: Logger2.ILogger;
    renderStorage: ReactRenderStorage;
    directiveSyntax: DirectiveSyntaxContext;
};

/** @internal */
export type EditorMarkupState = {markup: MarkupString};
