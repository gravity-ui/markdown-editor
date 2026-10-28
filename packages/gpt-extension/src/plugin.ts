import {Plugin} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

import type {CommonAnswer} from './ErrorScreen/types';
import {WIDGET_DECO_CLASS_NAME, WIDGET_DECO_SPEC_FLAG} from './constants';
import type {GptWidgetDecoViewParams} from './gptExtension/view';
import {GptWidgetDecoView} from './gptExtension/view';
import {pluginKey} from './plugin-key';
import type {GptWidgetMeta} from './plugin-key';
import {isEmptyGptPrompts} from './utils';

export {pluginKey};
export type {GptWidgetMeta};

export const gptWidgetPlugin = <
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(
    params: GptWidgetDecoViewParams<AnswerData, PromptData>,
): Plugin => {
    return new Plugin({
        key: pluginKey,
        state: {
            init: () => ({decorations: DecorationSet.empty, disablePromptPresets: false}),
            apply: (tr, previous) => {
                const meta = tr.getMeta(pluginKey) as GptWidgetMeta | undefined;
                const empty = {decorations: DecorationSet.empty, disablePromptPresets: false};

                if (meta?.action === 'show') {
                    const disablePromptPresets = meta.from === meta.to;
                    if (isEmptyGptPrompts(params, disablePromptPresets)) return empty;

                    const decoration = disablePromptPresets
                        ? Decoration.widget(
                              meta.from,
                              () => {
                                  const anchor = document.createElement('span');
                                  anchor.className = WIDGET_DECO_CLASS_NAME;
                                  anchor.textContent = ' ';
                                  return anchor;
                              },
                              {[WIDGET_DECO_SPEC_FLAG]: true},
                          )
                        : Decoration.inline(
                              meta.from,
                              meta.to,
                              {nodeName: 'span', class: WIDGET_DECO_CLASS_NAME},
                              {[WIDGET_DECO_SPEC_FLAG]: true},
                          );

                    return {
                        decorations: DecorationSet.create(tr.doc, [decoration]),
                        disablePromptPresets,
                    };
                }

                // A response must never replace text edited after the dialog was opened.
                if (meta?.action === 'hide' || tr.docChanged || tr.selectionSet) return empty;

                return previous;
            },
        },
        props: {
            decorations: (state) => pluginKey.getState(state)?.decorations,
        },
        view: (view) => new GptWidgetDecoView(view, params),
    });
};
