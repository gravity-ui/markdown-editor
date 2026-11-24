import {describe, expect, it} from 'vitest';

import {getSelectionControlPosition} from './selection-geometry';

const button = new DOMRect(0, 0, 28, 28);

describe('getSelectionControlPosition', () => {
    it.each([
        {edge: 'right', direction: 'ltr', left: 131},
        {edge: 'left', direction: 'rtl', left: 19},
    ] as const)(
        'should place the button at the top $edge of all selected owners',
        ({direction, left}) => {
            expect(
                getSelectionControlPosition(
                    [new DOMRect(20, 30, 60, 40), new DOMRect(80, 30, 80, 80)],
                    [new DOMRect(0, 0, 300, 200)],
                    button,
                    direction,
                ),
            ).toEqual({left, top: 31});
        },
    );

    it('should keep the button inside the intersection of clipping containers', () => {
        expect(
            getSelectionControlPosition(
                [new DOMRect(-30, -20, 250, 180)],
                [
                    new DOMRect(0, 0, 300, 200),
                    new DOMRect(40, 50, 140, 90),
                    new DOMRect(20, 10, 130, 160),
                ],
                button,
                'ltr',
            ),
        ).toEqual({left: 122, top: 50});
    });

    it('should fit the whole button when only a small part of the selection is visible', () => {
        expect(
            getSelectionControlPosition(
                [new DOMRect(-100, 90, 105, 40)],
                [new DOMRect(0, 0, 100, 100)],
                button,
                'ltr',
            ),
        ).toEqual({left: 0, top: 72});
    });

    it('should hide the button when the selection touches the clipping edge', () => {
        expect(
            getSelectionControlPosition(
                [new DOMRect(100, 0, 50, 50)],
                [new DOMRect(0, 0, 100, 100)],
                button,
                'ltr',
            ),
        ).toBeNull();
    });

    it('should hide the button when the clipping containers do not overlap', () => {
        expect(
            getSelectionControlPosition(
                [new DOMRect(0, 200, 150, 50)],
                [new DOMRect(0, 0, 300, 100), new DOMRect(0, 200, 300, 200)],
                button,
                'ltr',
            ),
        ).toBeNull();
    });
});
