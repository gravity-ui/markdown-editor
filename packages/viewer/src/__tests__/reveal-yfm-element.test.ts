import {assert, describe, expect, it} from 'vitest';

import {revealYfmElement} from '../index';

describe('revealYfmElement', () => {
    it('should return null for a null or missing target', () => {
        const root = createRoot('<a name="missing">Legacy anchor</a>');

        expect(revealYfmElement(null, {root})).toBeNull();
        expect(revealYfmElement({id: 'missing'}, {root})).toBeNull();
        expect(revealYfmElement({selector: '.missing'}, {root})).toBeNull();
    });

    it('should find a literal id without parsing it as a selector or URL', () => {
        const root = createRoot('<details><p>Text</p></details>');
        const target = root.querySelector('p');
        assert(target);
        target.id = 'part" #:[%20]';

        expect(revealYfmElement({id: target.id}, {root})).toBe(target);
        expect(root.querySelector('details')?.open).toBe(true);
    });

    it('should not treat a missing root id as an empty id', () => {
        expect(revealYfmElement({id: ''}, {root: createRoot('')})).toBeNull();
    });

    it('should reveal only the first selector match', () => {
        const root = createRoot('<details><p>First</p></details><details><p>Second</p></details>');

        expect(revealYfmElement({selector: 'p'}, {root})).toBe(root.querySelector('p'));
        expect(Array.from(root.querySelectorAll('details'), (details) => details.open)).toEqual([
            true,
            false,
        ]);
    });

    it('should search the document when root is omitted', () => {
        const root = createRoot('<details><p id="document-target">Text</p></details>');
        document.body.append(root);
        try {
            expect(revealYfmElement({id: 'document-target'})).toBe(root.querySelector('p'));
            expect(root.querySelector('details')?.open).toBe(true);
        } finally {
            root.remove();
        }
    });

    it('should reveal a detached element without an explicit root', () => {
        const root = createRoot('<details><p>Text</p></details>');

        expect(revealYfmElement(root.querySelector('p'))).toBe(root.querySelector('p'));
        expect(root.querySelector('details')?.open).toBe(true);
    });

    it('should include the root in revealing and stop at its boundary', () => {
        const outer = createRoot(
            '<details><details id="root"><p id="target">Text</p></details></details>',
        );
        const root = outer.querySelector('#root');
        assert(root);

        revealYfmElement({id: 'target'}, {root});

        expect(root.hasAttribute('open')).toBe(true);
        expect(outer.querySelector('details')?.open).toBe(false);
    });

    it('should reveal the target container itself', () => {
        const root = createRoot('<details id="target"><p>Text</p></details>');
        const target = root.querySelector('details');
        assert(target);

        expect(revealYfmElement({id: 'target'}, {root: target})).toBe(target);
        expect(target.open).toBe(true);
    });

    it('should reveal a target inside nested details', () => {
        const root = createRoot(
            '<details><summary>Outer</summary><details><summary>Inner</summary><p id="target">Text</p></details></details>',
        );
        const target = root.querySelector('#target');

        expect(revealYfmElement({id: 'target'}, {root})).toBe(target);
        expect(root.querySelectorAll('details[open]')).toHaveLength(2);
    });

    it('should keep the target summary closed while opening its outer details', () => {
        const root = createRoot(
            '<details><summary>Outer</summary><details id="inner"><summary><span id="target">Inner</span></summary>Text</details></details>',
        );

        revealYfmElement({id: 'target'}, {root});

        expect(root.querySelector('details')?.open).toBe(true);
        expect(root.querySelector('#inner')?.hasAttribute('open')).toBe(false);
    });

    it('should reject an element outside the root before opening its ancestors', () => {
        const outside = createRoot('<details><p>Text</p></details>');

        expect(revealYfmElement(outside.querySelector('p'), {root: createRoot('')})).toBeNull();
        expect(outside.querySelector('details')?.open).toBe(false);
    });

    it.each(['#slot', '#target'])('should reject a target in a slot: %s', (selector) => {
        const root = createRoot(`
            <details>
                <div data-markdown-viewer-slot id="slot"><span id="target">Text</span></div>
            </details>
        `);

        expect(revealYfmElement({selector}, {root})).toBeNull();
        expect(root.querySelector('details')?.open).toBe(false);
    });

    it('should ignore a slot above an explicit nested viewer root', () => {
        const outer = createRoot(
            '<div data-markdown-viewer-slot><div id="root"><details><p id="target">Text</p></details></div></div>',
        );
        const root = outer.querySelector('#root');
        assert(root);

        expect(revealYfmElement(root.querySelector('p'))).toBeNull();
        expect(revealYfmElement({id: 'target'}, {root})).toBe(root.querySelector('p'));
        expect(root.querySelector('details')?.open).toBe(true);
    });

    it('should preserve slots inside an HTML container', () => {
        const root = createRoot(
            '<details id="target"><div data-markdown-viewer-slot>Widget</div></details>',
        );
        const slot = root.querySelector('[data-markdown-viewer-slot]');

        revealYfmElement({id: 'target'}, {root});

        expect(root.querySelector('details')?.open).toBe(true);
        expect(root.querySelector('[data-markdown-viewer-slot]')).toBe(slot);
        expect(slot?.textContent).toBe('Widget');
    });

    it('should leave div cuts unchanged', () => {
        const root = createRoot('<div class="yfm-cut"><p id="target">Text</p></div>');

        revealYfmElement({id: 'target'}, {root});

        expect(root.querySelector('.yfm-cut')?.hasAttribute('open')).toBe(false);
    });

    it('should reveal outer folding sections without opening the target heading section', () => {
        const root = createRoot(`
            <section class="heading-section">
                <h1>Outer</h1>
                <div class="heading-section-content">
                    <section id="inner" class="heading-section">
                        <h2><span id="target">Inner</span></h2>
                        <div>Text</div>
                    </section>
                </div>
            </section>
        `);

        revealYfmElement({id: 'target'}, {root});

        expect(root.querySelector('.heading-section')?.classList.contains('open')).toBe(true);
        expect(root.querySelector('#inner')?.classList.contains('open')).toBe(false);
    });

    it('should delegate tab selection between opening outer and inner containers', () => {
        const root = createRoot(`
            <details id="outer">
                <summary>Outer</summary>
                <div class="yfm-tabs">
                    <div class="yfm-tab-list"><div class="yfm-tab" aria-controls="panel">Tab</div></div>
                    <div id="panel" class="yfm-tab-panel">
                        <details id="inner"><p id="target">Text</p></details>
                    </div>
                </div>
            </details>
        `);
        const states: boolean[][] = [];
        root.querySelector('.yfm-tab')?.addEventListener('click', () => {
            states.push([
                root.querySelector('#outer')?.hasAttribute('open') ?? false,
                root.querySelector('#inner')?.hasAttribute('open') ?? false,
            ]);
            root.querySelector('#panel')?.classList.add('active');
        });

        revealYfmElement({id: 'target'}, {root});
        revealYfmElement({id: 'target'}, {root});

        expect(states).toEqual([[true, false]]);
        expect(root.querySelector('#inner')?.hasAttribute('open')).toBe(true);
    });

    it('should find a dropdown tab by its panel label without changing tab state itself', () => {
        const root = createRoot(`
            <div class="yfm-tabs" data-diplodoc-variant="dropdown">
                <div class="yfm-tabs-dropdown-select">Choose</div>
                <ul>
                    <li class="yfm-tab" data-diplodoc-id="choice">Tab</li>
                </ul>
                <div class="yfm-tab-panel" aria-labelledby="choice"><p id="target">Text</p></div>
            </div>
        `);
        const clicks: string[] = [];
        root.addEventListener('click', (event) => {
            if (event.target instanceof Element) clicks.push(event.target.textContent ?? '');
        });

        revealYfmElement({id: 'target'}, {root});

        expect(clicks).toEqual(['Tab']);
        expect(root.querySelector('.yfm-tab-panel')?.classList.contains('active')).toBe(false);
    });

    it('should click a dropdown tab without ARIA links after HTML sanitization', () => {
        // Dropdown HTML after the default Diplodoc transform sanitizer.
        const root = createRoot(`
            <div class="yfm-tabs yfm-tabs-dropdown" data-diplodoc-variant="dropdown">
                <div role="tablist" class="yfm-tabs-dropdown-select">-</div>
                <ul class="yfm-tabs-dropdown-menu">
                    <li class="yfm-tab" data-diplodoc-id="one" data-diplodoc-key="one">One</li>
                    <li class="yfm-tab" data-diplodoc-id="two" data-diplodoc-key="two">Two</li>
                </ul>
                <div id="first" class="yfm-tab-panel" role="tabpanel" data-title="One"><p>First</p></div>
                <div id="second" class="yfm-tab-panel" role="tabpanel" data-title="Two"><p>Second target</p></div>
            </div>
        `);
        const clicks: EventTarget[] = [];
        root.addEventListener('click', (event) => {
            if (event.target) clicks.push(event.target);
        });

        revealYfmElement({selector: '#second p'}, {root});

        expect(clicks).toEqual([root.querySelector('[data-diplodoc-key="two"]')]);
        expect(root.querySelector('.yfm-tab-panel.active')).toBeNull();
    });

    it.each(['remove', 'slot'])(
        'should stop when a tab handler changes target ownership by %s',
        (change) => {
            const root = createRoot(`
            <div class="yfm-tabs">
                <div class="yfm-tab-list"><div class="yfm-tab" aria-controls="panel">Tab</div></div>
                <div id="panel" class="yfm-tab-panel">
                    <details><p id="target">Text</p></details>
                </div>
            </div>
        `);
            const target = root.querySelector('#target');
            const details = root.querySelector('details');
            root.querySelector('.yfm-tab')?.addEventListener('click', () => {
                if (change === 'remove') details?.remove();
                else details?.setAttribute('data-markdown-viewer-slot', '');
            });

            expect(revealYfmElement(target, {root})).toBeNull();
            expect(details?.open).toBe(false);
        },
    );

    it('should not click a tab control inside a slot', () => {
        const root = createRoot(`
            <div class="yfm-tabs">
                <div data-markdown-viewer-slot><button class="yfm-tab" aria-controls="panel">Tab</button></div>
                <div id="panel" class="yfm-tab-panel">Text</div>
            </div>
        `);
        let clicked = false;
        root.addEventListener('click', () => {
            clicked = true;
        });

        revealYfmElement({id: 'panel'}, {root});

        expect(clicked).toBe(false);
    });

    it('should not click a tab control outside the root', () => {
        const outer = createRoot(`
            <div class="yfm-tabs">
                <div class="yfm-tab-list"><button class="yfm-tab" aria-controls="panel">Tab</button></div>
                <div id="panel" class="yfm-tab-panel">Text</div>
            </div>
        `);
        const root = outer.querySelector('#panel');
        assert(root);
        let clicked = false;
        outer.addEventListener('click', () => {
            clicked = true;
        });

        revealYfmElement(root, {root});

        expect(clicked).toBe(false);
    });

    it('should reveal elements from another document', () => {
        const iframe = document.createElement('iframe');
        document.body.append(iframe);
        try {
            const root = iframe.contentDocument?.body;
            assert(root);
            root.innerHTML = '<details><p id="target">Text</p></details>';

            expect(revealYfmElement({id: 'target'}, {root})).toBe(root.querySelector('p'));
            expect(root.querySelector('details')?.open).toBe(true);
        } finally {
            iframe.remove();
        }
    });
});

function createRoot(html: string) {
    const root = document.createElement('div');
    root.innerHTML = html;
    return root;
}
