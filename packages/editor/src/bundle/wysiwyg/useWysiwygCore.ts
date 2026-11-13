import {useMemo} from 'react';

import type {MarkupString} from 'src/common';
import type {Extension} from 'src/core';

import type {ModeEvents} from '../shared/events';
import {BundlePreset} from '../wysiwyg-preset';

import {WysiwygCore} from './WysiwygCore';
import type {WysiwygCoreOptions} from './types';

/** @internal */
export function useWysiwygCore(
    options: WysiwygCoreOptions,
    events: ModeEvents,
    getInitialMarkup: () => MarkupString,
): WysiwygCore {
    return useMemo(() => {
        const {
            preset,
            renderStorage,
            directiveSyntax,
            md = {},
            handlers = {},
            experimental = {},
            config = {},
            wysiwygConfig = {},
            mobile,
            enableTabExitOnEscape = false,
        } = options;

        const extensions: Extension = (builder) => {
            const extensionOptions = wysiwygConfig.extensionOptions;

            builder.use(BundlePreset, {
                ...extensionOptions,
                emoji: {...config.emoji, ...extensionOptions?.emoji},
                directiveSyntax,
                preset,
                enableTabExitOnEscape,
                reactRenderer: renderStorage,
                onCancel: () => {
                    events.emit('cancel', null);
                    return true;
                },
                onSubmit: () => {
                    events.emit('submit', null);
                    return true;
                },
                disableMdAttrs: wysiwygConfig.disableMarkdownAttrs,
                preserveEmptyRows: experimental.preserveEmptyRows,
                placeholderOptions: wysiwygConfig.placeholderOptions,
                mdBreaks: md.breaks,
                fileUploadHandler: handlers.uploadFile,
                needToSetDimensionsForUploadedImages:
                    experimental.needToSetDimensionsForUploadedImages,
                enableNewImageSizeCalculation: experimental.enableNewImageSizeCalculation,
                mobile,
                searchPanel: wysiwygConfig.searchPanel ?? true,
            });

            if (wysiwygConfig.extensions) {
                builder.use(wysiwygConfig.extensions, extensionOptions);
            }
        };

        return new WysiwygCore(
            {...options, wysiwygConfig: {...wysiwygConfig, extensions}},
            events,
            getInitialMarkup,
        );
    }, [options, events, getInitialMarkup]);
}
