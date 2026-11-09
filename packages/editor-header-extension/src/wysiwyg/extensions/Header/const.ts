import {cn} from '@gravity-ui/markdown-editor';

export const STOP_EVENT_CLASSNAME = 'prosemirror-stop-event';
export const insertHeaderAction = 'insertHeader';
export const headerControlsClassName = cn('header-view')('controls');

/** Toolbar buttons of the block itself, without those of nested blocks. */
export const headerControlButtons = (block: Element) =>
    block.querySelectorAll<HTMLButtonElement>(`:scope > .${headerControlsClassName} button`);
