import {DOMParser, Fragment, type Schema} from 'prosemirror-model';

import {CheckboxAttr, b, checkboxInputType, checkboxLabelType} from './const';

export function getCheckboxContent(node: Node, schema: Schema): Fragment {
    if (!(node instanceof HTMLElement)) return Fragment.empty;

    const editorInput = node.firstElementChild;
    const editorLabel = editorInput?.nextElementSibling;
    if (editorInput?.matches('div[type=checkbox]') && editorLabel?.matches(`span.${b('label')}`)) {
        const input = checkboxInputType(schema).create({
            [CheckboxAttr.Checked]: editorInput.getAttribute(CheckboxAttr.Checked),
        });
        const label = DOMParser.fromSchema(schema).parse(editorLabel, {
            topNode: checkboxLabelType(schema).create(),
            preserveWhitespace: true,
        });
        return Fragment.from([input, label]);
    }

    const input =
        node instanceof HTMLInputElement ? node : node.querySelector('input[type=checkbox]');
    if (!(input instanceof HTMLInputElement)) return Fragment.empty;

    const labelText = findLabelForInput(input)?.textContent;
    return Fragment.from([
        checkboxInputType(schema).create({[CheckboxAttr.Checked]: input.checked ? 'true' : null}),
        checkboxLabelType(schema).create(null, labelText ? schema.text(labelText) : null),
    ]);
}

function findLabelForInput(element: HTMLInputElement): HTMLLabelElement | null {
    return element.labels?.[0] || findNextSiblingLabel(element);
}

// fallback for invalid HTML (input without id + label without for)
function findNextSiblingLabel(element: HTMLInputElement): HTMLLabelElement | null {
    const nextSibling = element.nextElementSibling;
    return nextSibling instanceof HTMLLabelElement ? nextSibling : null;
}
