import {ExtensionAuto} from '../../../core';

import {WidgetDecorationPlugin} from './plugin';

export {removeDecoration} from './actions';
export {widgetDecorationPluginKey} from './plugin';
export {WidgetDescriptor} from './WidgetDescriptor';
export {ReactWidgetDescriptor} from './ReactWidgetDescriptor';

export const WidgetDecoration: ExtensionAuto = (builder) => {
    builder.addPlugin(WidgetDecorationPlugin);
};
