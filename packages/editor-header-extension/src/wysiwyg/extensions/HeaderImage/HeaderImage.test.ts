// @vitest-environment jsdom
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {ImageSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {
    createTestEditor,
    emptyImage,
    header,
    image,
    nodePos,
    scriptUrl,
} from '../../../../tests/editor';

import {headerImageNodeName, headerImageNodeType} from './HeaderImageSpecs';

const {schema, markupParser, serializer, createView} = createTestEditor();

const roundTrip = (markup: string) => serializer.serialize(markupParser.parse(markup));

describe('Header image extension', () => {
    it('should parse the image as the first block of the header', () => {
        const doc = markupParser.parse(
            header(
                '::header-image{src="https://example.org/banner.jpg" alt="Team" title="Project team"}',
                'Text',
            ),
        );
        const banner = doc.child(0);
        expect(banner.child(0).type).toBe(headerImageNodeType(schema));
        expect(banner.child(0).attrs).toEqual({
            src: 'https://example.org/banner.jpg',
            alt: 'Team',
            title: 'Project team',
        });
        expect(banner.child(0).isAtom).toBe(true);
        expect(banner.child(1).textContent).toBe('Text');
    });

    it('should use the same defaults in the schema and parser', () => {
        const defaults = {src: null, alt: '', title: null};
        expect(headerImageNodeType(schema).create().attrs).toEqual(defaults);
        expect(markupParser.parse(header(emptyImage)).child(0).child(0).attrs).toEqual(defaults);
    });

    it.each([
        header(image, 'Text'),
        header('::header-image{src="https://example.org/image.jpg"}', 'Text'),
        header('::header-image{src="http://example.org/image.jpg" title="Project team"}', 'Text'),
        header('::header-image{src="blob:https://example.org/8c3c2f"}', 'Text'),
        header('::header-image{src="/image.jpg" alt="A \\"quote\\" and a \\\\ backslash"}', 'T'),
        header('::header-image{src="/image.jpg" alt="[brackets] and {braces}"}', 'Text'),
        header('::header-image{src="/image?a=1&b=2#top" alt="Q&A"}', 'Text'),
        header(emptyImage, 'Text'),
        `${header(image, 'Text')}\n\nAfter`,
    ])('should round trip %j', (markup) => {
        expect(roundTrip(markup)).toBe(markup);
    });

    it.each([
        [
            '::header-image{title="Project team" alt="Team" src="/image.jpg"}',
            '::header-image{src="/image.jpg" alt="Team" title="Project team"}',
        ],
        ['::header-image{src="/image.jpg" alt="" title=""}', '::header-image{src="/image.jpg"}'],
        [
            "::header-image{src='/image.jpg' alt=Team}",
            '::header-image{src="/image.jpg" alt="Team"}',
        ],
        [
            '::header-image{src="  /image.jpg  " unknown="value"}',
            '::header-image{src="/image.jpg"}',
        ],
        [
            '::header-image{src="/a?x=1&amp;y=2" alt="Q&amp;A"}',
            '::header-image{src="/a?x=1&y=2" alt="Q&A"}',
        ],
    ])('should write %j in the normal form', (markup, serialized) => {
        expect(roundTrip(header(markup, 'Text'))).toBe(header(serialized, 'Text'));
    });

    it.each([scriptUrl, 'data:image/png;base64,AAAA', 'vbscript:msgbox(1)', 'file:///etc/passwd'])(
        'should drop the unsafe address %j',
        (src) => {
            expect(roundTrip(header(`::header-image{src="${src}" alt="A"}`, 'Text'))).toBe(
                header('::header-image{alt="A"}', 'Text'),
            );
        },
    );

    it('should keep a header with only an image unchanged', () => {
        const doc = markupParser.parse(header(image));
        expect(doc.child(0).childCount).toBe(2);
        expect(roundTrip(header(image))).toBe(header(image));
    });

    it.each([
        `${image}\n\nText`,
        header('Text', image),
        header(image, '::header-image{src="/b.png"}', 'Text'),
    ])('should keep the text around a misplaced image in %j', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.textContent).toContain('Text');
        let images = 0;
        doc.descendants((node) => {
            if (node.type.name === headerImageNodeName) images++;
        });
        expect(images).toBeLessThan(2);
        expect(schema.nodes.doc.contentMatch.matchType(headerImageNodeType(schema))).toBeNull();
    });

    it('should allow only one image at the start of the header', () => {
        const type = schema.nodes.header;
        const img = headerImageNodeType(schema).create({src: '/a.png'});
        const p = schema.nodes.paragraph.create();
        expect(type.validContent(type.create(null, p).content.addToStart(img))).toBe(true);
        expect(() => type.create(null, [p, img]).check()).toThrow();
        expect(() => type.create(null, [img, img, p]).check()).toThrow();
    });

    it('should parse and serialize the HTML of the image before the core image', () => {
        const withImage = createTestEditor((builder) => builder.use(ImageSpecs, {}));
        const doc = withImage.markupParser.parse(header(image, 'Text'));
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(withImage.schema).serializeFragment(doc.content));
        const img = container.querySelector('img');
        expect(img?.className).toBe('g-md-header-image-plugin');
        expect(img?.getAttribute('data-files-gallery-exclude')).toBe('true');
        expect(container.firstElementChild?.getAttribute('data-files-gallery-exclude')).toBe(
            'true',
        );
        expect(DOMParser.fromSchema(withImage.schema).parse(container).toJSON()).toEqual(
            doc.toJSON(),
        );
    });

    it('should render an image with its attributes and an accessible name', () => {
        const view = createView(header('::header-image{src="/a.png" title="T"}', 'Text'));
        const dom = view.nodeDOM(nodePos(view, headerImageNodeName)) as HTMLElement;
        expect(dom.tagName).toBe('IMG');
        expect(dom.getAttribute('src')).toBe('/a.png');
        expect(dom.getAttribute('title')).toBe('T');
        expect(dom.getAttribute('role')).toBe('img');
        expect(dom.getAttribute('aria-label')).toBe('Image');
        expect(dom.getAttribute('data-files-gallery-exclude')).toBe('true');
    });

    it('should render the alternative text instead of a generated name', () => {
        const view = createView(header(image, 'Text'));
        const dom = view.nodeDOM(nodePos(view, headerImageNodeName)) as HTMLElement;
        expect(dom.getAttribute('alt')).toBe('A');
        expect(dom.hasAttribute('aria-label')).toBe(false);
    });

    it('should render a placeholder button for an image without an address', () => {
        const view = createView(header(emptyImage, 'Text'));
        const dom = view.nodeDOM(nodePos(view, headerImageNodeName)) as HTMLElement;
        expect(dom.tagName).toBe('DIV');
        expect(dom.getAttribute('role')).toBe('button');
        expect(dom.getAttribute('aria-label')).toBe('Add image');
        expect(dom.getAttribute('contenteditable')).toBe('false');
        expect(dom.classList.contains('g-md-header-image-nodeview_empty')).toBe(true);
    });
});
