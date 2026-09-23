import {describe, expect, it, vi} from 'vitest';

import type {AutocompleteAction} from '../../../behavior/Autocomplete';

import {EmojiHandler} from './EmojiHandler';

describe('EmojiHandler', () => {
    describe('onEnter', () => {
        it('should return false when no emoji is selected', () => {
            const handler = new EmojiHandler({
                defs: {smile: '😀'},
            });

            const action = {
                view: {},
            } as AutocompleteAction;

            // onEnter called without onOpen/onFilter - no emoji carousel initialized
            const result = handler.onEnter(action);

            expect(result).toBe(false);
        });

        it('should return true when emoji is selected', () => {
            const handler = new EmojiHandler({
                defs: {smile: '😀'},
            });

            // Access private _emojiCarousel to simulate selected emoji
            // @ts-expect-error - accessing private property for testing
            handler._emojiCarousel = {
                currentItem: {symbol: '😀', origName: 'smile', name: 'smile'},
            };

            const mockDispatch = vi.fn();
            const action = {
                view: {
                    state: {
                        selection: {empty: true},
                    },
                    dispatch: mockDispatch,
                },
            } as unknown as AutocompleteAction;

            const result = handler.onEnter(action);

            expect(result).toBe(true);
        });
    });
});
