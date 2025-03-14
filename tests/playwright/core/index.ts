import {test as base} from '@playwright/experimental-ct-react';

import {expectScreenshot} from './expectScreenshot';
import {mount} from './mount';
import type {Fixtures} from './types';
import {wait} from './wait';

export const test = base.extend<Fixtures>({
    mount,
    expectScreenshot,
    wait,
});

export {expect} from '@playwright/experimental-ct-react';
