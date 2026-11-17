import type {FilteredContenteditableAttributes} from '../../utils/contenteditable-attributes';

export const forbiddenAttributes = ['contenteditable'] as const;

export type WysiwygContenteditableAttributes = FilteredContenteditableAttributes<
    (typeof forbiddenAttributes)[number]
>;
