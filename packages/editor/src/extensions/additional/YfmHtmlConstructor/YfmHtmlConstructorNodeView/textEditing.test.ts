import {
    applyElementAttributes,
    editElementHtml,
    getEditableTextNode,
    getElementAttributes,
    getFirstEditableElement,
    getTextNodes,
    isIconSizedSvg,
    setElementText,
    setImageSrc,
    setLinkValues,
    setSvgIcon,
    setTextNodeValue,
} from './textEditing';

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

    describe('universal element editing', () => {
        it('lists every attribute as ordered name/value pairs', () => {
            const root = document.createElement('div');
            root.innerHTML = '<a href="x.html" title="Tip" class="cta">Go</a>';

            const link = root.querySelector('a') as HTMLAnchorElement;

            expect(getElementAttributes(link)).toEqual([
                {name: 'href', value: 'x.html'},
                {name: 'title', value: 'Tip'},
                {name: 'class', value: 'cta'},
            ]);
        });

        it('reconciles attributes: updates, adds and removes', () => {
            const root = document.createElement('div');
            root.innerHTML = '<a href="old.html" class="cta">Go</a>';

            const link = root.querySelector('a') as HTMLAnchorElement;
            applyElementAttributes(link, [
                {name: 'href', value: 'new.html'},
                {name: 'title', value: 'Added'},
            ]);

            expect(root.innerHTML).toBe('<a href="new.html" title="Added">Go</a>');
        });

        it('ignores attribute entries with an empty name', () => {
            const root = document.createElement('div');
            root.innerHTML = '<span class="x">Hi</span>';

            const span = root.querySelector('span') as HTMLSpanElement;
            applyElementAttributes(span, [
                {name: 'class', value: 'x'},
                {name: '', value: 'orphan'},
            ]);

            expect(root.innerHTML).toBe('<span class="x">Hi</span>');
        });

        it('rejects invalid attribute names without changing existing attributes', () => {
            const element = document.createElement('a');
            element.setAttribute('href', 'before.html');
            element.setAttribute('class', 'action');

            expect(
                applyElementAttributes(element, [
                    {name: 'title', value: 'Added'},
                    {name: 'invalid name', value: 'value'},
                ]),
            ).toBe(false);
            expect(element.outerHTML).toBe('<a href="before.html" class="action"></a>');
        });

        it('stages text and attribute edits without replacing the live popup anchor', () => {
            const root = document.createElement('div');
            root.innerHTML = '<p class="before">Hello <strong>world</strong></p>';
            const element = root.querySelector('p')!;

            expect(
                editElementHtml(root, element, {
                    text: 'Updated ',
                    attributes: [{name: 'class', value: 'after'}],
                }),
            ).toBe('<p class="after">Updated <strong>world</strong></p>');
            expect(root.innerHTML).toBe('<p class="before">Hello <strong>world</strong></p>');
            expect(root.firstElementChild).toBe(element);
        });

        it('rejects the whole edit when an attribute name is invalid', () => {
            const root = document.createElement('div');
            root.innerHTML = '<p class="before">Original</p>';

            expect(
                editElementHtml(root, root.firstElementChild!, {
                    text: 'Changed',
                    attributes: [{name: 'bad name', value: 'value'}],
                }),
            ).toBeNull();
            expect(root.innerHTML).toBe('<p class="before">Original</p>');
        });

        it('rejects edits to a replaced target', () => {
            const root = document.createElement('div');
            root.innerHTML = '<p>Before</p>';
            const target = root.firstElementChild!;
            root.innerHTML = '<p>After</p>';

            expect(editElementHtml(root, target, {text: 'Stale edit', attributes: []})).toBeNull();
            expect(root.innerHTML).toBe('<p>After</p>');
        });

        it('finds keyboard targets inside wrappers and skips hidden markup', () => {
            const root = document.createElement('div');
            root.innerHTML =
                '<style>p {color: red}</style><div hidden>Hidden</div><section><h2>Title</h2></section>';

            expect(getFirstEditableElement(root)).toBe(root.querySelector('h2'));
        });

        it('allows keyboard editing when a block contains only media', () => {
            const root = document.createElement('div');
            root.innerHTML = '<img src="hero.png">';

            expect(getFirstEditableElement(root)).toBe(root.querySelector('img'));
        });

        it('detects an editable direct text node', () => {
            const root = document.createElement('div');
            root.innerHTML = '<a href="x">Click <b>here</b></a>';

            const link = root.querySelector('a') as HTMLAnchorElement;
            const {node, canEdit} = getEditableTextNode(link);

            expect(canEdit).toBe(true);
            expect(node?.nodeValue).toBe('Click ');
        });

        it('allows authoring text in an empty leaf element', () => {
            const root = document.createElement('div');
            root.innerHTML = '<button></button>';

            const button = root.querySelector('button') as HTMLButtonElement;
            const {node, canEdit} = getEditableTextNode(button);

            expect(canEdit).toBe(true);
            expect(node).toBeNull();

            setElementText(button, node, 'Press me');
            expect(root.innerHTML).toBe('<button>Press me</button>');
        });

        it('reports no editable text for media and wrappers', () => {
            const root = document.createElement('div');
            root.innerHTML =
                '<img src="a.png"><div><span>child</span></div><svg viewBox="0 0 1 1"></svg>';

            const [img, wrapper, svg] = [
                root.querySelector('img') as HTMLImageElement,
                root.querySelector('div') as HTMLDivElement,
                root.querySelector('svg') as unknown as SVGSVGElement,
            ];

            expect(getEditableTextNode(img).canEdit).toBe(false);
            expect(getEditableTextNode(wrapper).canEdit).toBe(false);
            expect(getEditableTextNode(svg).canEdit).toBe(false);
        });

        it('treats small SVGs as icons and large ones as images', () => {
            const root = document.createElement('div');
            root.innerHTML =
                '<svg width="24" height="24"></svg><svg width="240" height="240"></svg>';

            const [small, large] = Array.from(
                root.querySelectorAll('svg'),
            ) as unknown as SVGSVGElement[];

            expect(isIconSizedSvg(small)).toBe(true);
            expect(isIconSizedSvg(large)).toBe(false);
        });

        it('replaces an inline svg glyph and returns the new element', () => {
            const root = document.createElement('div');
            root.innerHTML =
                '<svg class="icon" width="20" height="20" role="img" aria-label="Calendar"><path d="M0 0"/></svg>';

            const svg = root.querySelector('svg') as unknown as SVGSVGElement;
            const next = setSvgIcon(svg, '<svg viewBox="0 0 16 16"><rect/></svg>');

            expect(next).not.toBeNull();
            expect(root.querySelector('svg')?.getAttribute('class')).toBe('icon');
            expect(root.querySelector('svg')?.getAttribute('width')).toBe('20');
            expect(root.querySelector('svg')?.getAttribute('role')).toBe('img');
            expect(root.querySelector('svg')?.getAttribute('aria-label')).toBe('Calendar');
            expect(root.querySelector('rect')).not.toBeNull();
        });
    });
});
