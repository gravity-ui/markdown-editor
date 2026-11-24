import {bannerContentClassName} from './model';

/** The description has no options: only its class is rendered. */
export function bannerContentAttrs(): Record<string, string> {
    return {class: bannerContentClassName};
}
