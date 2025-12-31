import type {Command} from 'prosemirror-state';

export type Keymap = {
    [key: string]: Command;
};
