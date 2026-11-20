// @vitest-environment jsdom
import type {KeyboardEvent} from 'react';

import {describe, expect, it, vi} from 'vitest';

import {closeOnTabOut, closeUnlessAnchor} from './popup';

describe('closeUnlessAnchor', () => {
    const anchor = document.createElement('button');
    anchor.append(document.createElement('span'));
    const outside = document.createElement('div');

    it.each([
        {name: 'a press on the anchor', target: anchor, reason: 'outside-press', closes: false},
        {
            name: 'a press inside the anchor',
            target: anchor.firstElementChild,
            reason: 'outside-press',
            closes: false,
        },
        {name: 'a press outside', target: outside, reason: 'outside-press', closes: true},
        {name: 'Escape', target: anchor, reason: 'escape-key', closes: true},
        {name: 'focus out', target: outside, reason: 'focus-out', closes: true},
    ])('should handle $name', ({target, reason, closes}) => {
        for (const value of [anchor, () => anchor]) {
            const onClose = vi.fn();
            closeUnlessAnchor(value, onClose)(false, {target} as unknown as Event, reason);
            expect(onClose.mock.calls).toEqual(closes ? [[reason]] : []);
        }
    });

    it('should ignore opening', () => {
        const onClose = vi.fn();
        closeUnlessAnchor(anchor, onClose)(true);
        expect(onClose).not.toHaveBeenCalled();
    });
});

describe('closeOnTabOut', () => {
    const dialog = document.createElement('section');
    dialog.innerHTML = `
        <input data-name="first">
        <button disabled data-name="disabled"></button>
        <button data-name="middle"></button>
        <button tabindex="-1" data-name="skipped"></button>
        <input type="checkbox" data-name="last">
    `;
    const control = (name: string) => dialog.querySelector(`[data-name="${name}"]`);

    const press = (target: Element | null, key: string, shiftKey = false) => {
        const preventDefault = vi.fn();
        const onClose = vi.fn();
        const event = {
            key,
            shiftKey,
            target,
            currentTarget: dialog,
            nativeEvent: {defaultPrevented: false},
            preventDefault,
        } as unknown as KeyboardEvent<HTMLElement>;
        closeOnTabOut(event, onClose);
        return {closed: onClose.mock.calls, prevented: preventDefault.mock.calls.length > 0};
    };

    it.each([
        {name: 'Tab from the last control', target: 'last', shift: false, closes: true},
        {name: 'Shift+Tab from the first control', target: 'first', shift: true, closes: true},
        {name: 'Tab from the first control', target: 'first', shift: false, closes: false},
        {name: 'Shift+Tab from the last control', target: 'last', shift: true, closes: false},
        {name: 'Tab from a middle control', target: 'middle', shift: false, closes: false},
    ])('should handle $name', ({target, shift, closes}) => {
        expect(press(control(target), 'Tab', shift)).toEqual({
            closed: closes ? [['focus-out']] : [],
            prevented: closes,
        });
    });

    it('should ignore other keys', () => {
        expect(press(control('last'), 'Enter')).toEqual({closed: [], prevented: false});
    });
});
