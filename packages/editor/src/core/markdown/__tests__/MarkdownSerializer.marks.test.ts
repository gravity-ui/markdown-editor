import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {DefaultSpecsPreset} from '../../../presets/default-specs';
import {ExtensionsManager} from '../../ExtensionsManager';

describe('MarkdownSerializer marks', () => {
    it('should keep link and strike on a code space after nested emphasis', () => {
        const {parser, serializer} = createFixture();
        const source = '[***~~x~~***~~` `y~~](foo)';
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(text).toBe(source);
        expect(parser.parse(text)).toMatchNode(input);
    });

    it('should keep continuing emphasis across differently marked spaces', () => {
        const {doc, p, em, strong, parser, serializer} = createFixture();
        const input = doc(p(em('x'), strong(em(' ')), strong(' '), strong(em('y'))));
        const text = serializer.serialize(input);

        expect(text).toBe('*x  **y***');
        expect(parser.parse(text)).toMatchNode(doc(p(em('x  ', strong('y')))));
    });

    it('should keep expelled spaces outside emphasis when its delimiter can close', () => {
        const {doc, p, em, strong, parser, serializer} = createFixture();
        const input = doc(p(em('x'), strong(' '), strong(em('y'))));
        const text = serializer.serialize(input);

        expect(text).toBe('*x* ***y***');
        expect(parser.parse(text)).toMatchNode(doc(p(em('x'), ' ', strong(em('y')))));
    });

    it('should keep strike boundaries across spaces inside continuing emphasis', () => {
        const {doc, p, em, strong, s, parser, serializer} = createFixture();
        const input = doc(p(em(s('x')), em('  '), em(strong(s('y')))));
        const text = serializer.serialize(input);

        expect(text).toBe('*~~x~~  **~~y~~***');
        expect(parser.parse(text)).toMatchNode(input);
    });

    it.each([
        {name: 'inline code', source: '***x [`y`](foo)***[`z`](foo)'},
        {name: 'code with backticks', source: '***x [`y`](foo)***[`` z`w ``](foo)'},
        {name: 'code before an image', source: '***x [`y`](foo)***[`z`](foo)![x](a)'},
    ])('should keep a link on $name after reordered emphasis', ({source}) => {
        const {parser, serializer} = createFixture();
        const input = parser.parse(source);
        const text = serializer.serialize(input);

        expect(parser.parse(text)).toMatchNode(input);
    });
});

function createFixture() {
    const deps = new ExtensionsManager({
        extensions: (builder) => builder.use(DefaultSpecsPreset, {}),
    }).buildDeps();
    const nodes = builders<'doc' | 'p', 'em' | 'strong' | 's'>(deps.schema, {
        p: {nodeType: 'paragraph'},
        em: {markType: 'em'},
        strong: {markType: 'strong', 'data-markup': '**'},
        s: {markType: 'strike'},
    });
    return {...nodes, parser: deps.markupParser, serializer: deps.serializer};
}
