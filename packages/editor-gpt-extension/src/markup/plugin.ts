import {WidgetType} from '@codemirror/view';
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    type PluginValue,
    ViewPlugin,
    type ViewUpdate,
} from '@codemirror/view';

import {WIDGET_DECO_CLASS_NAME} from '../constants';
import type {MarkupGptHost} from '../host';
import type {CommonAnswer, GptWidgetOptions} from '../types';
import {isEmptyGptPrompts} from '../utils';

import {hideMarkupGpt} from './commands/gpt';
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
>(gptProps: GptWidgetOptions<AnswerData, PromptData>, host: MarkupGptHost) {
    return ViewPlugin.fromClass(
        class implements PluginValue {
            readonly _view: EditorView;
            readonly _renderItem;

            _anchor: Element | null = null;
            _sessionId = 0;

            decos: DecorationSet = Decoration.none;
            disablePromptPresets = true;
            markup: string | null = null;

            selectedPosition = {
                from: 0,
                to: 0,
            };

            constructor(view: EditorView) {
                this._view = view;
                this._renderItem = host
                    .getRenderer(view.state)
                    .createItem('gpt-in-markup-mode', () => this.renderPopup());
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.decos = Decoration.none;
                    this._anchor = null;
                    this._clearSelectedText();
                    this._renderItem.rerender();
                    return;
                }

                this.decos = this.decos.map(update.changes);

                const {from, to} = update.state.selection.main;

                this.selectedPosition.from = from;
                this.selectedPosition.to = to;

                for (const tr of update.transactions) {
                    for (const eff of tr.effects) {
                        if (eff.is(ShowMarkupGptEffect)) {
                            this._sessionId++;
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

                const sessionId = this._sessionId;
                return renderPopup(this._anchor as HTMLElement, {
                    ...gptProps,
                    sessionKey: this._sessionId,
                    disablePromptPresets: this.disablePromptPresets,
                    onUpdate: (answer) => {
                        if (sessionId === this._sessionId && this.decos.size)
                            gptProps.onUpdate?.(answer);
                    },
                    onClose: () => {
                        if (sessionId !== this._sessionId || !this.decos.size) return;
                        hideMarkupGpt(this._view);
                        this._view.contentDOM.focus({preventScroll: true});

                        gptProps.onClose?.();
                    },
                    markup: this.markup,
                    onApplyResult: (changedMarkup) => {
                        if (sessionId === this._sessionId) this._onApplyResult(changedMarkup);
                    },
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
                if (!this._anchor || !this.decos.size || this.markup === null) return;
                const {from, to} = this.selectedPosition;
                const changes = [{from, to, insert: changedMarkup}];

                const transaction = this._view.state.update({
                    changes,
                    effects: [HideMarkupGptEffect.of(null)],
                });

                this._view.dispatch(transaction);
                this._view.contentDOM.focus({preventScroll: true});
                gptProps.onApplyResult?.(changedMarkup);
            }
        },
        {
            decorations: (value) => value.decos,
        },
    );
}
