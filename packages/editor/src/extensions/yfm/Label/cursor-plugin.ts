import type {EditorState} from 'prosemirror-state';

import {getInlineAtomCursorState, inlineAtomCursorPlugin} from '../../../plugins/InlineAtom';

import {labelType} from './LabelSpecs';

export const getLabelCursorState = (state: EditorState) =>
    getInlineAtomCursorState(state, labelType(state.schema));

export const labelCursorPlugin = () => inlineAtomCursorPlugin(labelType);
