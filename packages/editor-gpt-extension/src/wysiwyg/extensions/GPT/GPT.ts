import type {Node} from 'prosemirror-model';
import type {Command, Plugin} from 'prosemirror-state';

import type {CommonAnswer} from '../../../components/ErrorScreen/types';
import {gptHotKeys} from '../../../constants';
import type {WysiwygGptHost} from '../../../host';
import type {GptWidgetOptions} from '../../../types';

import {runGpt} from './commands';
import {gptWidgetPlugin} from './plugin';

/** The editor capabilities needed to register GPT; no editor package dependency is required. */
export interface GptExtensionBuilder {
    Priority: {VeryLow: number};
    addAction(
        name: string,
        create: () => {
            isActive: () => boolean;
            isEnable: () => boolean;
            run: Command;
        },
    ): unknown;
    addPlugin(
        create: (deps: {
            serializer: {serialize(document: Node): string};
            markupParser: {parse(markup: string): Node};
        }) => Plugin,
    ): unknown;
    addKeymap(create: () => Record<string, Command>, priority: number): unknown;
}

export const gptActionName = 'addGptWidget';

export function createGptExtension(getRenderer: WysiwygGptHost['getRenderer']) {
    return function gptExtension<A extends CommonAnswer = CommonAnswer, P = unknown>(
        builder: GptExtensionBuilder,
        options: GptWidgetOptions<A, P>,
    ) {
        builder.addAction(gptActionName, () => ({
            isActive: () => false,
            isEnable: () => true,
            run: runGpt,
        }));
        builder.addPlugin(({serializer, markupParser}) =>
            gptWidgetPlugin({
                ...options,
                getRenderer,
                parser: markupParser,
                serializer,
            }),
        );
        builder.addKeymap(() => ({[gptHotKeys.openGptKey]: runGpt}), builder.Priority.VeryLow);
    };
}
