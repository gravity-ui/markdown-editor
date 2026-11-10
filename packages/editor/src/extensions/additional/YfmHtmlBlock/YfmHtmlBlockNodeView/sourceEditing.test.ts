import {describe, expect, it} from 'vitest';

import {getElementSource} from './sourceEditing';

const preview = (html: string) => {
    const root = document.createElement('div');
    root.innerHTML = html;
    return root;
};

describe('HTML element source editing', () => {
    it('should map a caret through escaped text and nested markup', () => {
        const html = '<p>First &amp; <strong>Текст с &lt;тегом&gt;</strong> last</p>';
        const root = preview(html);
        const target = root.querySelector('p')!;
        const node = root.querySelector('strong')!.firstChild!;
        const result = getElementSource(html, root, target, {node, offset: 6})!;
        expect(result.html.slice(result.offset)).toBe('с &lt;тегом&gt;</strong> last</p>');
        expect(result.html.slice(0, result.offset)).toBe('<p>First &amp; <strong>Текст ');
    });

    it('should distinguish repeated text nodes and preserve sibling elements', () => {
        const html = '<p>same</p><p>same <b>same</b> same</p><hr>';
        const root = preview(html);
        const target = root.querySelectorAll('p')[1];
        const result = getElementSource(html, root, target, {
            node: target.lastChild!,
            offset: 2,
        })!;
        expect(result.html.slice(result.offset)).toBe('ame</p>');
        expect(result.replace('<p>Updated <em>HTML</em></p>')).toBe(
            '<p>same</p><p>Updated <em>HTML</em></p><hr>',
        );
    });

    it('should place an image caret before its attributes', () => {
        const html = '<p>Before<img src="image.png" alt="Image">after</p>';
        const root = preview(html);
        const result = getElementSource(html, root, root.querySelector('img')!, null)!;
        expect(result.html.slice(result.offset)).toBe(' src="image.png" alt="Image">');
        expect(result.replace('<img src="other.png" alt="Updated">')).toBe(
            '<p>Before<img src="other.png" alt="Updated">after</p>',
        );
    });

    it('should map element boundaries and avoid marker collisions', () => {
        const html = '<p>__html_caret__<b>text</b>after</p>';
        const root = preview(html);
        const target = root.querySelector('p')!;
        const result = getElementSource(html, root, target, {node: target, offset: 2})!;
        expect(result.html.slice(result.offset)).toBe('after</p>');
    });

    it('should preserve table context when replacing a cell', () => {
        const html = '<table><tbody><tr><td>First</td><td>Second</td></tr></tbody></table>';
        const root = preview(html);
        const result = getElementSource(html, root, root.querySelector('td')!, null)!;
        expect(result.replace('<td><strong>Updated</strong></td>')).toBe(
            '<table><tbody><tr><td><strong>Updated</strong></td><td>Second</td></tr></tbody></table>',
        );
    });

    it('should reject a preview with a changed structure', () => {
        const root = preview('<p>Sanitized</p>');
        expect(
            getElementSource('<p><b>Original</b></p>', root, root.firstElementChild!, null),
        ).toBeNull();
    });
});
