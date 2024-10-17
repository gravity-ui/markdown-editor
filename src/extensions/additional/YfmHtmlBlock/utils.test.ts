import {SanitizeOptions} from '@diplodoc/transform/lib/sanitize';

import {getSanitizeYfmHtmlBlock, getYfmHtmlBlockOptions} from './utils'; // update the path accordingly

// remove all whitespaces and newline characters
const normalizeWhitespace = (str: string) => str.replace(/\s+/g, ' ').trim();

describe('sanitize options functions', () => {
    const defaultOptions: SanitizeOptions = {
        allowedTags: ['b', 'i', 'strong', 'em'],
        allowedAttributes: {
            a: ['href', 'name', 'target'],
        },
        cssWhiteList: {
            color: true,
            'font-weight': true,
        },
    };

    it('should merge additional tags into default options', () => {
        const options = getYfmHtmlBlockOptions(defaultOptions);
        expect(options.allowedTags).toEqual(expect.arrayContaining(['link', 'base', 'style']));
    });

    it('should merge additional attributes into default options', () => {
        const options = getYfmHtmlBlockOptions(defaultOptions);
        expect(options.allowedAttributes).toEqual({
            ...defaultOptions.allowedAttributes,
            link: ['rel', 'href'],
            base: ['target'],
            style: [],
        });
    });

    it('should merge additional css properties into default options', () => {
        const options = getYfmHtmlBlockOptions(defaultOptions);
        expect(options.cssWhiteList).toEqual({
            ...defaultOptions.cssWhiteList,
            'align-content': true,
            'align-items': true,
            'align-self': true,
            color: true,
            'column-count': true,
            'column-fill': true,
            'column-gap': true,
            'column-rule': true,
            'column-rule-color': true,
            'column-rule-style': true,
            'column-rule-width': true,
            'column-span': true,
            'column-width': true,
            columns: true,
            flex: true,
            'flex-basis': true,
            'flex-direction': true,
            'flex-flow': true,
            'flex-grow': true,
            'flex-shrink': true,
            'flex-wrap': true,
            'font-weight': true,
            gap: true,
            grid: true,
            'grid-area': true,
            'grid-auto-columns': true,
            'grid-auto-flow': true,
            'grid-auto-rows': true,
            'grid-column': true,
            'grid-column-end': true,
            'grid-column-start': true,
            'grid-row': true,
            'grid-row-end': true,
            'grid-row-start': true,
            'grid-template': true,
            'grid-template-areas': true,
            'grid-template-columns': true,
            'grid-template-rows': true,
            'justify-content': true,
            'justify-items': true,
            'justify-self': true,
            'line-height': true,
            'object-fit': true,
            'object-position': true,
            order: true,
            orphans: true,
            'row-gap': true,
            all: true,
            bottom: true,
            content: true,
            cursor: true,
            direction: true,
            left: true,
            'line-break': true,
            opacity: true,
            overflow: true,
            'overflow-wrap': true,
            'overflow-x': true,
            'overflow-y': true,
            position: true,
            right: true,
            top: true,
            'white-space': true,
            'z-index': true,
        });
    });
});

describe('sanitize HTML function', () => {
    const options: SanitizeOptions = {
        allowedTags: ['b', 'i', 'strong', 'em'],
        allowedAttributes: {
            a: ['href', 'name', 'target'],
        },
        cssWhiteList: {
            color: true,
            'font-weight': true,
        },
    };

    it('should sanitize HTML content with additional options', () => {
        const htmlContent = `
            <b>Bold</b>
            <i>Italic</i>
            <link href="styles.css" rel="stylesheet" />
            <base target="_blank" />
            <style>.example { flex: 1; columns: 1; }</style>
        `;

        const sanitizeYfmHtmlBlock = getSanitizeYfmHtmlBlock({options});
        const sanitizedContent = normalizeWhitespace(sanitizeYfmHtmlBlock(htmlContent));

        expect(sanitizedContent).toContain('<link href="styles.css" rel="stylesheet" />');
        expect(sanitizedContent).toContain('<base target="_blank" />');
        expect(sanitizedContent).toContain(
            normalizeWhitespace('<style>.example { flex: 1; columns: 1; }</style>'),
        );
    });

    it('should sanitize HTML content using a custom sanitize function', () => {
        // example of custom sanitize logic
        const customSanitize = (html: string, _?: SanitizeOptions): string => {
            return html.replace(/<style.*<\/style>/, '<style></style>');
        };

        const htmlContent = '<style>.example { flex: 1; columns: 1; }</style>';
        const expectedSanitizedContent = '<style></style>';

        const sanitizeYfmHtmlBlock = getSanitizeYfmHtmlBlock({options, sanitize: customSanitize});
        const sanitizedContent = sanitizeYfmHtmlBlock(htmlContent);

        expect(sanitizedContent).toEqual(expectedSanitizedContent);
    });
});
