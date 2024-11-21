/* eslint-disable no-implicit-globals */

import type {Node} from 'prosemirror-model';

import type {Parser, Serializer} from '../src/core';

export function createMarkupChecker({
    parser,
    serializer,
}: {
    parser: Parser;
    serializer: Serializer;
}) {
    function parse(text: string, doc: Node, {json}: {json?: boolean} = {}) {
        if (json) expect(parser.parse(text)).toMatchNodeJson(doc);
        else expect(parser.parse(text)).toMatchNode(doc);
    }

    function serialize(doc: Node, text: string) {
        if (serializer.serialize(doc) !== text)
            console.log(JSON.stringify(doc.toJSON()), serializer.serialize(doc), text);
        expect(serializer.serialize(doc)).toBe(text);
    }

    function same(text: string, doc: Node) {
        parse(text, doc);
        serialize(doc, text);
    }

    return {same, parse, serialize};
}
