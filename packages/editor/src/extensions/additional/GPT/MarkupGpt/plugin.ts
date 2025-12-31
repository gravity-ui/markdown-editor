import {WidgetType} from '@codemirror/view';

import type {GptWidgetOptions} from '../../..';
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    type PluginValue,
    ViewPlugin,
    type ViewUpdate,
} from '../../../../cm/view';
import {ReactRendererFacet} from '../../../../markup';
import type {CommonAnswer} from '../ErrorScreen/types';
import {WIDGET_DECO_CLASS_NAME} from '../constants';
import {isEmptyGptPrompts} from '../utils';

import {hideMarkupGpt} from './commands';
import {HideMarkupGptEffect, ShowMarkupGptEffect} from './effects';
import {renderPopup} from './popup';

class SpanWidget extends WidgetType {
    private className = '';
    private textContent = '';

    constructor(className: string, textContent: string) {
        super();
        this.className = className;
        this.textContent = textContent;
    }

    toDOM() {
        const spanElem = document.createElement('span');
        spanElem.className = this.className;
        spanElem.textContent = this.textContent;
        return spanElem;
    }
}

export function mGptPlugin<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>(gptProps: GptWidgetOptions<AnswerData, PromptData>) {
    return ViewPlugin.fromClass(
        class implements PluginValue {
            readonly _view: EditorView;
            readonly _renderItem;

            _anchor: Element | null = null;

            decos: DecorationSet = Decoration.none;
            disablePromptPresets = true;
            markup: string | null = null;

            selectedPosition = {
                from: 0,
                to: 0,
            };

            constructor(view: EditorView) {
                this._view = view;
                this._renderItem = view.state
                    .facet(ReactRendererFacet)
                    .createItem('gpt-in-markup-mode', () => this.renderPopup());
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.decos = Decoration.none;
                    return;
                }

                this.decos = this.decos.map(update.changes);

                const {from, to} = update.state.selection.main;

                this.selectedPosition.from = from;
                this.selectedPosition.to = to;

                for (const tr of update.transactions) {
                    for (const eff of tr.effects) {
                        if (eff.is(ShowMarkupGptEffect)) {
                            this._setSelectedText(this._getDecorationText(update, from, to));

                            if (from === to) {
                                this.disablePromptPresets = true;

                                if (isEmptyGptPrompts(gptProps, true)) return;

                                const decorationWidget = Decoration.widget({
                                    widget: new SpanWidget(WIDGET_DECO_CLASS_NAME, ' '),
                                });

                                this.decos = Decoration.set([decorationWidget.range(from)]);

                                return;
                            }

                            this.disablePromptPresets = false;

                            if (isEmptyGptPrompts(gptProps, false)) return;

                            this.decos = Decoration.set([
                                {
                                    from,
                                    to,
                                    value: Decoration.mark({class: WIDGET_DECO_CLASS_NAME}),
                                },
                            ]);
                        }

                        if (eff.is(HideMarkupGptEffect)) {
                            this.decos = Decoration.none;
                        }
                    }
                }
            }

            docViewUpdate() {
                this._anchor = this._view.dom
                    .getElementsByClassName(WIDGET_DECO_CLASS_NAME)
                    .item(0);
                this._renderItem.rerender();
            }

            destroy() {
                this._clearSelectedText();
                this._renderItem.remove();
            }

            renderPopup() {
                if (!this._anchor || this.markup === null) {
                    return null;
                }

                return renderPopup(this._anchor as HTMLElement, {
                    ...gptProps,
                    disablePromptPresets: this.disablePromptPresets,
                    onClose: () => {
                        hideMarkupGpt(this._view);

                        gptProps.onClose?.();
                    },
                    markup: this.markup,
                    onApplyResult: (changedMarkup) => this._onApplyResult(changedMarkup),
                });
            }

            _getDecorationText(update: ViewUpdate, from: number, to: number): string {
                return update.state.doc.sliceString(from, to);
            }

            _clearSelectedText() {
                this.markup = null;
            }

            _setSelectedText(str: string) {
                this.markup = str;
            }

            _onApplyResult(changedMarkup: string) {
                const {from, to} = this.selectedPosition;
                const changes = [{from: from, to: to, insert: changedMarkup}];

                const transaction = this._view.state.update({
                    changes: changes,
                    effects: [HideMarkupGptEffect.of(null)],
                });

                this._view.dispatch(transaction);
            }
        },
        {
            decorations: (value) => value.decos,
        },
    );
}
