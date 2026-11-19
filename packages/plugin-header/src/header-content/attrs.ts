import {headerContentClassName} from './model';

/** The description has no options: only its class is rendered. */
export function headerContentAttrs(): Record<string, string> {
    return {class: headerContentClassName};
}
