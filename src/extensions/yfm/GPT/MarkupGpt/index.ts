import {GptWidgetOptions} from '../../..';

import {mGptPlugin} from './plugin';

export {mGptToolbarItem} from './toolbar';
export {showMarkupGpt, hideMarkupGpt} from './commands';

export function mGptExtension(props: GptWidgetOptions) {
    return mGptPlugin(props).extension;
}
