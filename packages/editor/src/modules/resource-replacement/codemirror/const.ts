import {Annotation, StateEffect} from '@codemirror/state';

import type {ResourceBatch} from './types';

export const resolved = Annotation.define<boolean>();
export const tracked = Annotation.define<ResourceBatch>();
export const release = StateEffect.define<string>();
