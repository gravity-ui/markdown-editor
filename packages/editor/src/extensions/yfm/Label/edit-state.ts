import {createInlineAtomEditing} from '../../../plugins/InlineAtom';

import {labelCn, labelType} from './LabelSpecs';

const labelEditing = createInlineAtomEditing({
    name: 'label-edit',
    className: labelCn(),
    nodeType: labelType,
});

/** A label opened by a click or an insertion moves the focus to the caption field. */
export const labelEditPlugin = labelEditing.plugin;
export const startLabelEdit = labelEditing.start;
export const isLabelEdited = labelEditing.isEdited;
export const getLabelEditId = labelEditing.getEditId;
