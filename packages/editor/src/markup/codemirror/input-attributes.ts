import {Compartment} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

import {
    type FilteredContenteditableAttributes,
    filterContenteditableAttributes,
} from '../../utils/contenteditable-attributes';

const forbiddenAttributes = [
    'contenteditable',
    'role',
    'aria-multiline',
    'aria-readonly',
    'aria-autocomplete',
    'aria-haspopup',
    'aria-controls',
    'aria-activedescendant',
] as const;

export type MarkupContenteditableAttributes = FilteredContenteditableAttributes<
    (typeof forbiddenAttributes)[number]
>;

export const inputAttributesCompartment = new Compartment();

export function setContenteditableAttributes(
    view: EditorView,
    attributes?: MarkupContenteditableAttributes,
): void {
    view.dispatch({
        effects: inputAttributesCompartment.reconfigure(
            EditorView.contentAttributes.of(
                filterContenteditableAttributes(attributes, forbiddenAttributes),
            ),
        ),
    });
}
