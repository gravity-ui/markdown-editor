import {InlineAtomPlugin} from '@gravity-ui/markdown-editor';

import {labelNodeType} from '../../LabelSpecs';

export const labelCursorPlugin = () => InlineAtomPlugin.inlineAtomCursorPlugin(labelNodeType);
