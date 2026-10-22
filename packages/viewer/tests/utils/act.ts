import * as React from 'react';

import {act as legacyAct} from 'react-dom/test-utils';

const react: typeof React & {act?: typeof legacyAct} = React;

export const act = react.act || legacyAct;
