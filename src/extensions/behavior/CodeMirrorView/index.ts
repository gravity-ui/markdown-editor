import {keydownHandler} from 'prosemirror-keymap';
import {Plugin} from 'prosemirror-state';

import {ExtensionWithOptions} from '../../../core';
import {capitalize} from '../../../lodash';

import {codeLangSelectTooltipViewCreator} from './TooltipPlugin';
import {YCThemeStore, ycThemeWatcherPlugin} from './YCThemeWatcher';
import {CodeBlockView} from './cm/CodeBlockView';
import {getUniqueModeNames} from './cm/codemodes';
import {arrowHandler} from './commands';
import {codeBlockNodeName} from './const';

export type CodeMirrorViewOptions = {
    onCancel?: () => boolean;
    onSubmit?: () => boolean;
    codeBlockPlaceholder?: CodeMirror.EditorConfiguration['placeholder'] | (() => string);
};

export const CodeMirrorViewExtension: ExtensionWithOptions<CodeMirrorViewOptions> = (
    builder,
    options,
) => {
    builder.addPlugin(() => {
        const watcherEmitter = new YCThemeStore();
        const langItems = getUniqueModeNames().map((name) => ({
            value: name,
            title: capitalize(name),
        }));

        return [
            ycThemeWatcherPlugin(watcherEmitter),
            new Plugin({
                props: {
                    nodeViews: {
                        [codeBlockNodeName]: CodeBlockView.creator({
                            ...options,
                            themeWatcher: watcherEmitter,
                        }),
                    },
                    // same as keymap({})
                    handleKeyDown: keydownHandler({
                        ArrowLeft: arrowHandler('left', codeBlockNodeName),
                        ArrowRight: arrowHandler('right', codeBlockNodeName),
                        ArrowUp: arrowHandler('up', codeBlockNodeName),
                        ArrowDown: arrowHandler('down', codeBlockNodeName),
                    }),
                },
                view: (view) => codeLangSelectTooltipViewCreator(view, langItems),
            }),
        ];
    });
};
