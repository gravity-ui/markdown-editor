import {InlineAtomPlugin} from '@gravity-ui/markdown-editor';
import type {EditorState} from '@gravity-ui/markdown-editor/pm/state';

import {labelNodeType} from '../../LabelSpecs';

export const getLabelCursorState = (state: EditorState) =>
    InlineAtomPlugin.getInlineAtomCursorState(state, labelNodeType(state.schema));

export const labelCursorPlugin = () => InlineAtomPlugin.inlineAtomCursorPlugin(labelNodeType);
