import {createContext} from 'react';

import type {ViewerLifecycle} from './viewer-lifecycle';

export const ViewerContext = createContext<ViewerLifecycle | null>(null);
