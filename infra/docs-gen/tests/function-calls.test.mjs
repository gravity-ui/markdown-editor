import {afterEach, describe, expect, it, vi} from 'vitest';

import {exportedDeclaration} from '../src/extension-pages/extension-graph.mjs';
import {functionCalls} from '../src/extension-pages/function-calls.mjs';

import {indexFixture} from './test-fixture.mjs';

const DEPTH = 18;

let fixture;

afterEach(() => fixture?.cleanup());

describe('functionCalls', () => {
    it('should skip helper subgraphs without selected calls', () => {
        const helpers = Array.from(
            {length: DEPTH},
            (_, i) => `const f${i + 1} = () => { f${i}(); f${i}(); };`,
        );
        fixture = indexFixture(
            [
                'const f0 = () => {};',
                ...helpers,
                `export const Sample = () => { f${DEPTH}(); };`,
            ].join('\n'),
        );
        const {index, file} = fixture;
        const isSelected = vi.fn(() => false);

        const {calls} = functionCalls(
            index,
            exportedDeclaration(index, file, 'Sample').initializer,
            isSelected,
        );

        const callCount = 2 * DEPTH + 1;
        expect(calls).toEqual([]);
        expect(isSelected.mock.calls.length).toBeLessThanOrEqual(2 * callCount);
    });
});
