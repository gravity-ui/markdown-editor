import {
    wHeading1ItemData,
    wHeading2ItemData,
    wHeading3ItemData,
    wHeading4ItemData,
    wHeading5ItemData,
    wHeading6ItemData,
} from '../../../bundle/config/w-heading-config';

import {filterActions} from './handler';

describe('Heading aliases', () => {
    it('should have correct aliases', () => {
        expect(wHeading1ItemData.aliases).toContain('h1');
        expect(wHeading2ItemData.aliases).toContain('h2');
        expect(wHeading3ItemData.aliases).toContain('h3');
        expect(wHeading4ItemData.aliases).toContain('h4');
        expect(wHeading5ItemData.aliases).toContain('h5');
        expect(wHeading6ItemData.aliases).toContain('h6');
    });

    it('should filter commands by aliases', () => {
        const commands = [
            wHeading1ItemData,
            wHeading2ItemData,
            wHeading3ItemData,
            wHeading4ItemData,
            wHeading5ItemData,
            wHeading6ItemData,
        ];

        for (let i = 1; i <= 6; i++) {
            expect(filterActions(commands, `h${i}`)).toHaveLength(1);
            expect(filterActions(commands, `h${i}`)[0]).toBe(commands[i - 1]);
        }

        expect(filterActions(commands, 'h')).toHaveLength(6); // Should match all h1-h6
    });
});
