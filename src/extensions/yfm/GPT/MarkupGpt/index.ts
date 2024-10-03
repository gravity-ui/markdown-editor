import {GptWidgetOptions} from '../../..';

import {mGptExamplePlugin} from './plugin';

export {mGptExampleToolbarItem} from './toolbar';
export {showMarkupGptExample, hideMarkupGptExample} from './commands';

export function mGptExampleExtension(props: GptWidgetOptions) {
    return mGptExamplePlugin(props).extension;
}
