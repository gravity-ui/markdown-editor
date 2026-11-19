import {expect, it} from 'vitest';

import {toIframeCssVariables} from '../index';

it('should map supported styles to iframe CSS variables', () => {
    const styles = {colorLinkVisited: 'purple', fontFamily: 'serif', custom: 'unused'};

    expect(toIframeCssVariables(styles)).toEqual({
        '--yfm-html-color-link-visited': 'purple',
        '--yfm-html-font-family': 'serif',
    });
});
