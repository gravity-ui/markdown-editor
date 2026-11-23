import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    BaseSchemaSpecs,
    BlockquoteSpecs,
    CodeSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {TermSpecs, termDefinitionNodeName, termNodeName} from '.';

const {markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(CodeSpecs)
            .use(ListsSpecs)
            .use(TermSpecs),
}).buildDeps();

function attrsOf(doc: Node, name: string) {
    const attrs: unknown[] = [];
    doc.descendants((node) => {
        if (node.type.name === name) attrs.push(node.attrs);
    });
    return attrs;
}

describe('Diplodoc Term conversion', () => {
    it('should parse two inline terms with one shared definition', () => {
        const doc = markupParser.parse(
            'See [API](*api) and [the interface](*api).\n\n[*api]: A shared **definition**.',
        );
        const paragraph = doc.child(0);

        expect(paragraph.child(1).isInline && paragraph.child(1).isAtom).toBe(true);
        expect(attrsOf(doc, termNodeName)).toEqual([
            {key: 'api', label: 'API'},
            {key: 'api', label: 'the interface'},
        ]);
        expect(attrsOf(doc, termDefinitionNodeName)).toEqual([
            {key: 'api', definition: 'A shared **definition**.'},
        ]);
    });

    it.each([
        '[API](*api)\n\n[*api]: A definition.',
        '\\![API](*api)\n\n[*api]: A definition.',
        '[API](*api) and [Термин](*ключ)\n\n[*api]: A definition.\n\n[*ключ]: Another definition.',
        '> [\\[API\\]](*api)\n\n[*api]: A line.\nAnother line.',
        '- [API](*api)\n\n[*api]: **A** definition.\n\n[*unused]: An unused definition.',
        '[*unused]: An unused definition.',
    ])('should preserve the document across a mode switch for %j', (source) => {
        const doc = markupParser.parse(source);
        const saved = serializer.serialize(doc);
        expect(markupParser.parse(saved).eq(doc)).toBe(true);
    });

    it('should keep the reference syntax distinct from code and undefined terms', () => {
        const doc = markupParser.parse(
            'Code: `[API](*api)`. Undefined: [missing](*missing).\n\n[*api]: A definition.',
        );
        expect(attrsOf(doc, termNodeName)).toEqual([]);
        expect(attrsOf(doc, termDefinitionNodeName)).toEqual([
            {key: 'api', definition: 'A definition.'},
        ]);
    });

    it('should move the first definition to the end and write it once', () => {
        const source = '[*api]: First definition.\n\n[API](*api).\n\n[*api]: Second definition.';
        expect(serializer.serialize(markupParser.parse(source))).toBe(
            '[API](*api).\n\n[*api]: First definition.',
        );
    });
});
