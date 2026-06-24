import type {PluginOptions} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';

import type {Action, ExtensionAuto, ExtensionDeps, NodeViewConstructor} from '../../../core';

import type {YfmHtmlConstructorExtensionOptions} from '../YfmHtmlConstructor/types';

import {WYfmHtmlBlockNodeView} from './YfmHtmlBlockNodeView';
import {YfmHtmlBlockSpecs} from './YfmHtmlBlockSpecs';
import {YfmHtmlBlockAction} from './YfmHtmlBlockSpecs/const';
import {addYfmHtmlBlock} from './actions';
import type {YfmHtmlBlockTemplatesOptions} from './templates';

// Every object inherits `constructor: Function`, so a literal without an own
// `constructor` property must still satisfy this option type.
type YfmHtmlBlockConstructorOptions = YfmHtmlConstructorExtensionOptions | Function;

export interface YfmHtmlBlockOptions extends Omit<
    PluginOptions,
    'runtimeJsPath' | 'containerClasses' | 'bundle' | 'embeddingMode'
> {
    useConfig?: () => IHTMLIFrameElementConfig | undefined;
    autoSave?: {
        enabled: boolean;
        delay?: number; // по умолчанию 1000ms
    };
    templates?: YfmHtmlBlockTemplatesOptions;
    constructor?: YfmHtmlBlockConstructorOptions;
    /**
     * Double-clicking the preview edits text inline inside the iframe instead of
     * opening the raw HTML code editor. The code editor stays reachable via the
     * "Edit" menu item.
     * @default false
     */
    editablePreview?: boolean;
}

export const YfmHtmlBlock: ExtensionAuto<YfmHtmlBlockOptions> = (
    builder,
    extensionOptions,
) => {
    const {
        useConfig: _,
        constructor: constructorOptions,
        ...options
    } = extensionOptions;
    const nodeViewOptions = Object.prototype.hasOwnProperty.call(extensionOptions, 'constructor')
        ? {...options, constructor: constructorOptions}
        : options;

    builder.use(YfmHtmlBlockSpecs, {
        nodeView: YfmHtmlBlockNodeViewFactory(nodeViewOptions),
        ...options,
    });

    builder.addAction(YfmHtmlBlockAction, () => addYfmHtmlBlock);
};

const YfmHtmlBlockNodeViewFactory: (
    options: YfmHtmlBlockOptions,
) => (deps: ExtensionDeps) => NodeViewConstructor = (options) => () => (node, view, getPos) => {
    return new WYfmHtmlBlockNodeView({node, view, getPos, options});
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [YfmHtmlBlockAction]: Action;
        }
    }
}
