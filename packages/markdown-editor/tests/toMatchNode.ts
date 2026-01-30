/* eslint-disable @typescript-eslint/no-namespace */

import type {Node} from 'prosemirror-model';
import {eq} from 'prosemirror-test-builder';

const toJson = (node: Node) => JSON.stringify(node.toJSON());

expect.extend({
    toMatchNode: (received: Node, expect: Node) => {
        return {
            message: () =>
                `nodes do not match.\n\nreceived: ${received}\n\tjson: ${toJson(
                    received,
                )}\n\nexpect: ${expect}\n\tjson: ${toJson(expect)}`,
            pass: eq(received, expect),
        };
    },
    toMatchNodeJson: (received: Node, expect: Node) => {
        return {
            message: () =>
                `nodes do not match.\n\nreceived: ${received}\n\tjson: ${toJson(
                    received,
                )}\n\nexpect: ${expect}\n\tjson: ${toJson(expect)}`,
            pass: toJson(received) === toJson(expect),
        };
    },
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchNode(expect: Node): R;
            toMatchNodeJson(expect: Node): R;
        }
    }
}
