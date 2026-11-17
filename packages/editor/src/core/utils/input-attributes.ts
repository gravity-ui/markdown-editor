import type {EditorView} from 'prosemirror-view';

import {
    type FilteredContenteditableAttributes,
    filterContenteditableAttributes,
} from '../../utils/contenteditable-attributes';

const forbiddenAttributes = ['contenteditable'] as const;

export type WysiwygContenteditableAttributes = FilteredContenteditableAttributes<
    (typeof forbiddenAttributes)[number]
>;

export function setContenteditableAttributes(
    view: EditorView,
    attributes?: WysiwygContenteditableAttributes,
): void {
    if (view.isDestroyed) return;
    view.setProps({
        attributes: filterContenteditableAttributes(attributes, forbiddenAttributes),
    });
}
