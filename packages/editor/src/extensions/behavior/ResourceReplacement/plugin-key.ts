import {PluginKey} from 'prosemirror-state';

import type {ResourceReplacementState} from './types';

export const resourceReplacementKey = new PluginKey<ResourceReplacementState>(
    'resourceReplacement',
);
