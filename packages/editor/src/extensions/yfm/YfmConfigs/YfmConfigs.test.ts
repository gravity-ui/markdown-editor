import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';
import {describe, expect, it} from 'vitest';

import {ExtensionsManager} from '#core';

import {BaseNode, BaseSchemaSpecs} from '../../base/specs';

import {YfmConfigsSpecs, type YfmConfigsSpecsOptions} from './YfmConfigsSpecs';

describe('YfmConfigs extension', () => {
    it.each(['markupParser', 'textParser'] as const)('should ignore lint tokens in %s', (name) => {
        const deps = createDeps();
        const markup = 'before\n\nafter';
        const tokens = new MarkdownIt().parse(markup, {});
        const lint = new Token('__yfm_lint', '', 0);
        lint.content = 'lint message';
        tokens.splice(3, 0, lint);

        const doc = deps[name].parse(tokens);

        expect(doc.toJSON()).toEqual(deps[name].parse(markup).toJSON());
        expect(deps.serializer.serialize(doc)).toBe(markup);
    });

    it('should apply attributes only to the markup parser', () => {
        const {markupParser, textParser} = createDeps();
        const markup = 'text{#anchor}';
        const doc = markupParser.parse(markup);
        const textDoc = textParser.parse(markup);

        expect(doc.firstChild?.attrs.id).toBe('anchor');
        expect(doc.textContent).toBe('text');
        expect(textDoc.firstChild?.attrs.id).toBeNull();
        expect(textDoc.textContent).toBe(markup);
    });

    it('should allow only id by default', () => {
        const {markupParser} = createDeps();
        const doc = markupParser.parse('text{#anchor .custom}');

        expect(doc.firstChild?.attrs.id).toBe('anchor');
        expect(doc.firstChild?.attrs.class).toBeNull();
    });

    it('should use custom allowed attributes', () => {
        const {markupParser} = createDeps({attrs: {allowedAttributes: ['class']}});
        const doc = markupParser.parse('text{#anchor .custom}');

        expect(doc.firstChild?.attrs.id).toBeNull();
        expect(doc.firstChild?.attrs.class).toBe('custom');
    });

    it('should keep attribute markup when attributes are disabled', () => {
        const {markupParser, textParser} = createDeps({disableAttrs: true});
        const markup = 'text{#anchor}';

        for (const parser of [markupParser, textParser]) {
            const doc = parser.parse(markup);
            expect(doc.firstChild?.attrs.id).toBeNull();
            expect(doc.textContent).toBe(markup);
        }
    });
});

function createDeps(options: YfmConfigsSpecsOptions = {}) {
    return new ExtensionsManager({
        extensions: (builder) =>
            builder
                .use(BaseSchemaSpecs, {})
                .overrideNodeSpec(BaseNode.Paragraph, (prev) => ({
                    ...prev,
                    attrs: {...prev.attrs, id: {default: null}, class: {default: null}},
                }))
                .use(YfmConfigsSpecs, options),
    }).buildDeps();
}
