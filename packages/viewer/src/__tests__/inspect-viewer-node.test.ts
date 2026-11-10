import {assert, describe, expect, it} from 'vitest';

import {VIEWER_SLOT_ATTRIBUTE, inspectViewerNode} from '../index';

describe('inspectViewerNode', () => {
    it('should detect slots nested inside a content element', () => {
        const root = document.createElement('div');
        const heading = document.createElement('h2');
        const wrapper = document.createElement('span');
        const slot = document.createElement('span');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        wrapper.append(slot);
        heading.append(wrapper);
        root.append(heading);

        expect(inspectViewerNode(root, heading)).toEqual({kind: 'content', hasSlots: true});
    });

    it('should classify a slot and its descendants', () => {
        const root = document.createElement('div');
        const slot = document.createElement('span');
        const button = document.createElement('button');
        const text = document.createTextNode('Action');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        button.append(text);
        slot.append(button);
        root.append(slot);

        expect(inspectViewerNode(root, slot)).toEqual({kind: 'slot'});
        expect(inspectViewerNode(root, button)).toEqual({kind: 'slot'});
        expect(inspectViewerNode(root, text)).toEqual({kind: 'slot'});
    });

    it('should classify an element outside the root', () => {
        const root = document.createElement('div');
        const element = document.createElement('p');

        expect(inspectViewerNode(root, element)).toEqual({kind: 'outside'});
    });

    it.each([
        {name: 'text', create: () => document.createTextNode('Text')},
        {name: 'comment', create: () => document.createComment('Comment')},
        {
            name: 'processing instruction',
            create: () => document.createProcessingInstruction('x', ''),
        },
    ])('should classify a content $name node', ({create}) => {
        const root = document.createElement('div');
        const node = create();
        root.append(node);

        expect(inspectViewerNode(root, node)).toEqual({kind: 'content', hasSlots: false});
    });

    it.each([
        {name: 'text', create: () => document.createTextNode('Text')},
        {name: 'document', create: () => document},
        {name: 'fragment', create: () => document.createDocumentFragment()},
    ])('should classify an external $name node', ({create}) => {
        const root = document.createElement('div');

        expect(inspectViewerNode(root, create())).toEqual({kind: 'outside'});
    });

    it('should exclude attributes from the content tree', () => {
        const root = document.createElement('div');
        const attribute = document.createAttribute('title');
        root.setAttributeNode(attribute);

        expect(inspectViewerNode(root, attribute)).toEqual({kind: 'outside'});
    });

    it('should ignore slots in sibling branches', () => {
        const root = document.createElement('div');
        const heading = document.createElement('h2');
        const text = document.createTextNode('Title');
        const slot = document.createElement('span');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        root.append(heading, text, slot);

        expect(inspectViewerNode(root, heading)).toEqual({kind: 'content', hasSlots: false});
        expect(inspectViewerNode(root, text)).toEqual({kind: 'content', hasSlots: false});
    });

    it('should classify a nested viewer relative to its own root', () => {
        const outerRoot = document.createElement('div');
        const slot = document.createElement('span');
        const innerRoot = document.createElement('div');
        const paragraph = document.createElement('p');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        innerRoot.append(paragraph);
        slot.append(innerRoot);
        outerRoot.append(slot);

        expect(inspectViewerNode(outerRoot, paragraph)).toEqual({kind: 'slot'});
        expect(inspectViewerNode(innerRoot, paragraph)).toEqual({kind: 'content', hasSlots: false});
        expect(inspectViewerNode(innerRoot, innerRoot)).toEqual({kind: 'content', hasSlots: false});
    });

    it('should classify an external node under a slot', () => {
        const slot = document.createElement('span');
        const root = document.createElement('div');
        const sibling = document.createElement('p');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        slot.append(root, sibling);

        expect(inspectViewerNode(root, sibling)).toEqual({kind: 'outside'});
    });

    it('should include the root in content inspection', () => {
        const root = document.createElement('div');

        expect(inspectViewerNode(root, root)).toEqual({kind: 'content', hasSlots: false});

        const slot = document.createElement('span');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        root.append(slot);

        expect(inspectViewerNode(root, root)).toEqual({kind: 'content', hasSlots: true});
    });

    it('should treat a marked root and its content as a slot', () => {
        const root = document.createElement('div');
        const text = document.createTextNode('Text');
        root.setAttribute(VIEWER_SLOT_ATTRIBUTE, 'custom-value');
        root.append(text);

        expect(inspectViewerNode(root, root)).toEqual({kind: 'slot'});
        expect(inspectViewerNode(root, text)).toEqual({kind: 'slot'});
    });

    it('should classify content without slots in connected and detached trees', () => {
        const root = document.createElement('div');
        const paragraph = document.createElement('p');
        root.append(paragraph);
        document.body.append(root);
        try {
            expect(inspectViewerNode(root, paragraph)).toEqual({kind: 'content', hasSlots: false});
        } finally {
            root.remove();
        }

        expect(inspectViewerNode(root, paragraph)).toEqual({kind: 'content', hasSlots: false});
    });

    it('should report current slot markers and preserve earlier results', () => {
        const root = document.createElement('div');
        const heading = document.createElement('h2');
        const slot = document.createElement('span');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        heading.append(slot);
        root.append(heading);

        const before = inspectViewerNode(root, heading);

        slot.removeAttribute(VIEWER_SLOT_ATTRIBUTE);

        expect(inspectViewerNode(root, heading)).toEqual({kind: 'content', hasSlots: false});
        expect(before).toEqual({kind: 'content', hasSlots: true});
    });

    it('should inspect the current location after a node moves', () => {
        const root = document.createElement('div');
        const slot = document.createElement('span');
        const text = document.createTextNode('Text');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        root.append(slot, text);

        expect(inspectViewerNode(root, text)).toEqual({kind: 'content', hasSlots: false});

        slot.append(text);
        expect(inspectViewerNode(root, text)).toEqual({kind: 'slot'});

        text.remove();
        expect(inspectViewerNode(root, text)).toEqual({kind: 'outside'});
    });

    it('should inspect SVG content and slots', () => {
        const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const slot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
        root.append(slot);

        expect(inspectViewerNode(root, root)).toEqual({kind: 'content', hasSlots: true});
        expect(inspectViewerNode(root, slot)).toEqual({kind: 'slot'});
    });

    it('should inspect nodes from another window', () => {
        const iframe = document.createElement('iframe');
        document.body.append(iframe);
        try {
            const foreignDocument = iframe.contentDocument;
            assert(foreignDocument);
            const root = foreignDocument.createElement('div');
            const slot = foreignDocument.createElement('span');
            slot.setAttribute(VIEWER_SLOT_ATTRIBUTE, '');
            root.append(slot);

            expect(inspectViewerNode(root, root)).toEqual({kind: 'content', hasSlots: true});
            expect(inspectViewerNode(root, slot)).toEqual({kind: 'slot'});
        } finally {
            iframe.remove();
        }
    });
});
