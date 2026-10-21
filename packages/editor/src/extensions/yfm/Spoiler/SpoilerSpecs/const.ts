import {SpoilerClassName as SpoilerViewClassName} from 'src/markdown-it/spoiler';

export const spoilerMarkName = 'spoiler';

export const SpoilerClassName = {
    ...SpoilerViewClassName,
    /** Decoration for the spoiler that the editor selection touches */
    Editing: 'yfm-spoiler__editing',
} as const;
