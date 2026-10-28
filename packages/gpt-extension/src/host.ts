import type {ReactNode} from 'react';

import type {EditorState as MarkupState} from '@codemirror/state';
import type {Node} from 'prosemirror-model';
import type {EditorState as WysiwygState} from 'prosemirror-state';

export interface GptRenderItem {
    rerender(): void;
    remove(): void;
}

export interface GptRenderer {
    createItem(id: string, render: () => ReactNode): GptRenderItem;
}

export interface WysiwygGptHost {
    getRenderer(state: WysiwygState): GptRenderer;
    parse(markup: string): Node;
    serialize(document: Node): string;
}

export interface MarkupGptHost {
    getRenderer(state: MarkupState): GptRenderer;
}
