import {Plugin} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

import {WIDGET_DECO_CLASS_NAME, WIDGET_DECO_SPEC_FLAG} from '../../../constants';
import type {CommonAnswer} from '../../../types';
import {isEmptyGptPrompts} from '../../../utils';

import {pluginKey} from './plugin-key';
import type {GptWidgetMeta} from './plugin-key';
import type {GptWidgetDecoViewParams} from './view';
import {GptWidgetDecoView} from './view';

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
            init: () => DecorationSet.empty,
            apply: (tr, decos, previous) => {
                const meta = tr.getMeta(pluginKey) as GptWidgetMeta | undefined;

                if (meta?.action === 'show') {
                    if (isEmptyGptPrompts(params, meta.from === meta.to))
                        return DecorationSet.empty;

                    if (meta.to === meta.from) {
                        const spanElem = document.createElement('span');
                        spanElem.className = WIDGET_DECO_CLASS_NAME;
                        spanElem.textContent = ' ';

                        return DecorationSet.create(tr.doc, [
                            Decoration.widget(meta.from, spanElem, {
                                [WIDGET_DECO_SPEC_FLAG]: true,
                            }),
                        ]);
                    }

                    return DecorationSet.create(tr.doc, [
                        Decoration.inline(
                            meta.from,
                            meta.to,
                            {nodeName: 'span', class: WIDGET_DECO_CLASS_NAME},
                            {[WIDGET_DECO_SPEC_FLAG]: true},
                        ),
                    ]);
                }

                if (
                    meta?.action === 'hide' ||
                    tr.docChanged ||
                    !tr.selection.eq(previous.selection)
                ) {
                    return DecorationSet.empty;
                }

                return decos.map(tr.mapping, tr.doc);
            },
        },
        props: {
            decorations: (state) => pluginKey.getState(state),
        },
        view: (view) => new GptWidgetDecoView(view, params),
    });
};
