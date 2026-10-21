import MarkdownIt from 'markdown-it';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import spoiler from '../../../markdown-it/spoiler';

import {bindYfmSpoilers} from './useYfmSpoiler';

const md = new MarkdownIt().use(spoiler);

describe('bindYfmSpoilers', () => {
    let container: HTMLElement;
    let unbind: () => void;

    const getSpoilers = () => Array.from(container.querySelectorAll<HTMLElement>('.yfm-spoiler'));

    const click = (elem: Element) => {
        const event = new MouseEvent('click', {bubbles: true, cancelable: true});
        elem.dispatchEvent(event);
        return event;
    };

    const press = (elem: Element, key: string) => {
        const event = new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true});
        elem.dispatchEvent(event);
        return event;
    };

    const getLink = () => container.querySelector('a') as HTMLAnchorElement;

    const render = (markup: string) => {
        container.innerHTML = md.render(markup);
    };

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        render(':spoiler[one [link](#target)] and :spoiler[two]');
        unbind = bindYfmSpoilers(container);
    });

    afterEach(() => {
        unbind();
        container.remove();
    });

    it('should make hidden spoilers accessible buttons', () => {
        for (const elem of getSpoilers()) {
            expect(elem.getAttribute('role')).toBe('button');
            expect(elem.getAttribute('tabindex')).toBe('0');
            expect(elem.getAttribute('aria-expanded')).toBe('false');
            expect(elem.getAttribute('aria-label')).toBe('Spoiler');
        }
        expect(container.querySelector('a')?.getAttribute('tabindex')).toBe('-1');
    });

    it('should reveal spoiler on click', () => {
        const [first, second] = getSpoilers();
        click(first);

        expect(first.classList.contains('yfm-spoiler_revealed')).toBe(true);
        expect(first.hasAttribute('role')).toBe(false);
        expect(first.hasAttribute('tabindex')).toBe(false);
        expect(first.hasAttribute('aria-label')).toBe(false);
        expect(container.querySelector('a')?.hasAttribute('tabindex')).toBe(false);
        expect(second.classList.contains('yfm-spoiler_revealed')).toBe(false);
    });

    it('should reveal spoiler before the link inside it opens', () => {
        const link = getLink();

        const firstClick = click(link);
        expect(firstClick.defaultPrevented).toBe(true);
        expect(getSpoilers()[0].classList.contains('yfm-spoiler_revealed')).toBe(true);

        const secondClick = click(link);
        expect(secondClick.defaultPrevented).toBe(false);
    });

    it.each(['Enter', ' '])('should reveal spoiler with %j key', (key) => {
        const [first] = getSpoilers();
        first.focus();
        const event = press(first, key);

        expect(event.defaultPrevented).toBe(true);
        expect(first.classList.contains('yfm-spoiler_revealed')).toBe(true);
        // The focus stays on the revealed spoiler
        expect(document.activeElement).toBe(first);
        expect(first.getAttribute('tabindex')).toBe('-1');
    });

    it('should ignore other keys', () => {
        const [first] = getSpoilers();
        const event = press(first, 'a');

        expect(event.defaultPrevented).toBe(false);
        expect(first.classList.contains('yfm-spoiler_revealed')).toBe(false);
    });

    it('should reveal nested spoilers with one click', () => {
        render(':spoiler[outer :spoiler[inner]]');
        const [outer, inner] = getSpoilers();
        click(inner);

        expect(outer.classList.contains('yfm-spoiler_revealed')).toBe(true);
        expect(inner.classList.contains('yfm-spoiler_revealed')).toBe(true);
    });

    it('should prepare spoilers from new html', async () => {
        render('text :spoiler[new]');
        await Promise.resolve();

        expect(getSpoilers()[0].getAttribute('role')).toBe('button');
    });

    it('should not change html outside spoilers', () => {
        render('plain [link](#target)');
        const html = container.innerHTML;
        const event = click(getLink());

        expect(event.defaultPrevented).toBe(false);
        expect(container.innerHTML).toBe(html);
    });

    it('should remove handlers', () => {
        unbind();
        const [first] = getSpoilers();
        click(first);

        expect(first.classList.contains('yfm-spoiler_revealed')).toBe(false);
    });
});
