import {afterEach, describe, expect, it} from 'vitest';

import {configure} from './configure';
import {i18n} from './i18n/extension';
import {gptItemView} from './toolbar/view/items';

afterEach(() => configure({lang: 'en'}));

describe('GPT language configuration', () => {
    it('should update toolbar translations without recreating items', () => {
        configure({lang: 'en'});
        const english = gptItemView.title();
        configure({lang: 'ru'});
        expect(gptItemView.title()).toBe(i18n('help-with-text'));
        expect(gptItemView.title()).not.toBe(english);
        configure({lang: 'en'});
        expect(gptItemView.title()).toBe(english);
    });
});
