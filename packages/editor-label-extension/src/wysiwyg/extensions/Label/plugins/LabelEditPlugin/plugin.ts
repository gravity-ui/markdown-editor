import {InlineAtomPlugin} from '@gravity-ui/markdown-editor';
import {labelClassName} from '@gravity-ui/markdown-plugin-label';

import {labelNodeType} from '../../LabelSpecs';

const labelEditing = InlineAtomPlugin.createInlineAtomEditing({
    name: 'label-edit',
    className: labelClassName,
    nodeType: labelNodeType,
});

/** A label opened by a click or an insertion moves the focus to the caption field. */
export const labelEditPlugin = labelEditing.plugin;
export const startLabelEdit = labelEditing.start;
export const getLabelEditId = labelEditing.getEditId;
