// @vitest-environment jsdom
import {describe, expect, it, vi} from 'vitest';

import {syncDomAttrs} from './nodeview';

function createDom() {
    const dom = document.createElement('div');
    dom.className = 'own';
    syncDomAttrs(dom, {}, {class: 'block block_a', 'data-a': '1', 'data-b': '2'});
    dom.classList.add('ProseMirror-selectednode');
    return dom;
}

describe('syncDomAttrs', () => {
    it('should not write attributes or classes with the same values', () => {
        const dom = createDom();
        const setAttribute = vi.spyOn(dom, 'setAttribute');
        const add = vi.spyOn(dom.classList, 'add');
        const remove = vi.spyOn(dom.classList, 'remove');
        const attrs = {class: 'block block_a', 'data-a': '1', 'data-b': '2'};
        syncDomAttrs(dom, attrs, {...attrs});
        expect(setAttribute).not.toHaveBeenCalled();
        expect(add).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
    });

    it('should write only the changed attributes and remove the missing ones', () => {
        const dom = createDom();
        const setAttribute = vi.spyOn(dom, 'setAttribute');
        syncDomAttrs(
            dom,
            {class: 'block block_a', 'data-a': '1', 'data-b': '2'},
            {class: 'block block_a', 'data-a': '3', 'data-c': '4'},
        );
        expect(setAttribute.mock.calls).toEqual([
            ['data-a', '3'],
            ['data-c', '4'],
        ]);
        expect(dom.hasAttribute('data-b')).toBe(false);
    });

    it('should change only the differing classes and keep the classes added by others', () => {
        const dom = createDom();
        const add = vi.spyOn(dom.classList, 'add');
        const remove = vi.spyOn(dom.classList, 'remove');
        syncDomAttrs(dom, {class: 'block block_a'}, {class: 'block block_b'});
        expect(remove).toHaveBeenCalledWith('block_a');
        expect(add).toHaveBeenCalledWith('block_b');
        expect(Array.from(dom.classList)).toEqual([
            'own',
            'block',
            'ProseMirror-selectednode',
            'block_b',
        ]);
    });
});
