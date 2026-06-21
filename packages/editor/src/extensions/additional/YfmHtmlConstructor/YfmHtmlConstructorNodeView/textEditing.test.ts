import {getTextNodes, setImageSrc, setLinkValues, setTextNodeValue} from './textEditing';

describe('YfmHtmlConstructor inline editing', () => {
    it('lists non-empty text nodes in document order', () => {
        const root = document.createElement('div');
        root.innerHTML = '<h2>Title</h2>\n  \n<p>Body <strong>bold</strong></p>';

        expect(getTextNodes(root).map((node) => node.nodeValue)).toEqual([
            'Title',
            'Body ',
            'bold',
        ]);
    });

    it('updates a text node value in place', () => {
        const root = document.createElement('div');
        root.innerHTML = '<p>Hello</p>';

        const textNode = root.querySelector('p')?.firstChild as Text;
        setTextNodeValue(textNode, 'Updated');

        expect(root.innerHTML).toBe('<p>Updated</p>');
    });

    it('updates link text and href while preserving other attributes', () => {
        const root = document.createElement('div');
        root.innerHTML = '<a href="before.html" class="action">Before</a>';

        const link = root.querySelector('a') as HTMLAnchorElement;
        setLinkValues(link, 'After', 'after.html');

        expect(root.innerHTML).toBe('<a href="after.html" class="action">After</a>');
    });

    it('updates image src while preserving other attributes', () => {
        const root = document.createElement('div');
        root.innerHTML = '<img src="before.png" alt="Preview" class="hero">';

        const image = root.querySelector('img') as HTMLImageElement;
        setImageSrc(image, 'after.png');

        expect(root.innerHTML).toBe('<img src="after.png" alt="Preview" class="hero">');
    });
});
