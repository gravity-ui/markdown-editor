import {StateEffect} from '@codemirror/state';

export const AddUploadWidgetEffect = StateEffect.define<{files: ArrayLike<File>; pos: number}>();
export const RemoveUploadWidgetEffect = StateEffect.define<{id: string; markup?: string}>();
