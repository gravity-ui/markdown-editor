import {describe, expect, it} from 'vitest';

import {editElementHtml, getEditableTextNode} from './textEditing';

describe('HTML block inline editing', () => {
    it('should update direct text and attributes while preserving nested markup', () => {
        const source =
            '<style>strong{color:red}</style><p class="before">Hello <strong>world</strong></p>';
        const preview = document.createElement('div');
        preview.innerHTML = source;
        const target = preview.querySelector('p')!;

        expect(
            editElementHtml(source, preview, target, {
                text: 'Updated ',
                attributes: [{name: 'class', value: 'after'}],
            }),
        ).toBe(
            '<style>strong{color:red}</style><p class="after">Updated <strong>world</strong></p>',
        );
        expect(preview.innerHTML).toBe(source);
    });

    it('should update image attributes without adding text', () => {
        const source = '<p>Intro</p><img src="before.png" alt="Before">';
        const preview = document.createElement('div');
        preview.innerHTML = source;
        const target = preview.querySelector('img')!;

        expect(getEditableTextNode(target).canEdit).toBe(false);
        expect(
            editElementHtml(source, preview, target, {
                attributes: [
                    {name: 'src', value: 'after.png'},
                    {name: 'alt', value: 'After'},
                ],
            }),
        ).toBe('<p>Intro</p><img src="after.png" alt="After">');
    });

    it('should edit rendered elements when the preview omits a style element', () => {
        const source = '<style>h1{color:red}</style><h1>Original</h1>';
        const preview = document.createElement('div');
        preview.innerHTML = '<h1>Original</h1>';

        expect(
            editElementHtml(source, preview, preview.querySelector('h1')!, {
                text: 'Updated',
                attributes: [],
            }),
        ).toBe('<style>h1{color:red}</style><h1>Updated</h1>');
    });

    it('should reject invalid attributes and mismatched preview structures', () => {
        const source = '<p>Original</p>';
        const preview = document.createElement('div');
        preview.innerHTML = source;
        const target = preview.querySelector('p')!;

        expect(
            editElementHtml(source, preview, target, {
                attributes: [{name: 'invalid name', value: 'x'}],
            }),
        ).toBeNull();
        preview.innerHTML = '<section><p>Original</p></section>';
        expect(
            editElementHtml(source, preview, preview.querySelector('p')!, {attributes: []}),
        ).toBeNull();
    });
});
