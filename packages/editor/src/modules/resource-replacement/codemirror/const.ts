import {Annotation, StateEffect} from '@codemirror/state';

export const resolved = Annotation.define<boolean>();
export const tracked = Annotation.define<string>();
export const release = StateEffect.define<string>();
