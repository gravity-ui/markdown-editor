import {Plugin, PluginKey} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

import {WIDGET_DECO_CLASS_NAME, WIDGET_DECO_SPEC_FLAG} from './constants';
import type {GptWidgetDecoViewParams} from './gptExtension/view';
import {GptWidgetDecoView} from './gptExtension/view';

export type GptWidgetMeta =
    | {
          action: 'show';
          from: number;
          to: number;
      }
    | {
          action: 'hide';
      };

const key = new PluginKey<DecorationSet>('gpt-widget');

export {key as pluginKey};

export const gptWidgetPlugin = (params: GptWidgetDecoViewParams): Plugin => {
    return new Plugin({
        key,
        state: {
            init: () => DecorationSet.empty,
            apply: (tr, decos) => {
                const meta = tr.getMeta(key) as GptWidgetMeta | undefined;
                const paramsGpt = params;

                if (meta?.action === 'show') {
                    if (meta.to === meta.from) {
                        const spanElem = document.createElement('span');
                        spanElem.className = WIDGET_DECO_CLASS_NAME;
                        spanElem.textContent = ' ';

                        paramsGpt.disablePromptPresets = true;

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

                if (meta?.action === 'hide') {
                    paramsGpt.disablePromptPresets = false;

                    return DecorationSet.empty;
                }

                return decos.map(tr.mapping, tr.doc);
            },
        },
        props: {
            decorations: (state) => key.getState(state),
        },
        view: (view) => new GptWidgetDecoView(view, params),
    });
};
