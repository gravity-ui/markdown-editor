import type {Node} from 'prosemirror-model';
import {eq} from 'prosemirror-test-builder';
import {expect} from 'vitest';

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

declare module 'vitest' {
    interface Matchers<R> {
        toMatchNode(expect: Node): R;
        toMatchNodeJson(expect: Node): R;
    }
}

function toJson(node: Node) {
    return JSON.stringify(node.toJSON());
}
