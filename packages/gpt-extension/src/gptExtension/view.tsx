import {Slice} from 'prosemirror-model';
import type {EditorState, PluginView} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {CommonAnswer} from '../ErrorScreen/types';
import {GptPopup} from '../GptPopup/GptPopup';
import {WIDGET_DECO_CLASS_NAME, WIDGET_DECO_SPEC_FLAG} from '../constants';
import type {WysiwygGptHost} from '../host';
import type {GptWidgetMeta} from '../plugin-key';
import {pluginKey} from '../plugin-key';
import type {GptDialogProps} from '../types';

export {cnGptPopup} from '../GptPopup/GptPopup';

export type GptWidgetDecoViewParams<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Omit<GptDialogProps<AnswerData, PromptData>, 'markup' | 'onApplyResult'> & {
    host: WysiwygGptHost;
} & {
    onApplyResult?: GptDialogProps['onApplyResult'];
};

export class GptWidgetDecoView<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> implements Required<PluginView> {
    private readonly _view;
    private readonly _renderer;

    private _decoElem: Element | null = null;
    private _params: GptWidgetDecoViewParams<AnswerData, PromptData>;
    private _destroyed = false;

    constructor(view: EditorView, params: GptWidgetDecoViewParams<AnswerData, PromptData>) {
        this._view = view;

        this._params = params;

        this._renderer = params.host
            .getRenderer(view.state)
            .createItem('gpt-widget-view', this._render.bind(this));
    }

    update(view: EditorView, _prevState: EditorState): void {
        const decoElements = Array.from(view.dom.querySelectorAll(`.${WIDGET_DECO_CLASS_NAME}`));

        this._decoElem = decoElements.at(-1) ?? null;
        this._renderer.rerender();
    }

    destroy(): void {
        this._destroyed = true;
        this._resetState();

        this._renderer.remove();
    }

    private _resetState() {
        this._decoElem = null;
    }

    private _render() {
        if (!this._decoElem) return null;

        const markup = this._getContentOfDecoration();

        if (markup === undefined) {
            return null;
        }

        return (
            <GptPopup
                markup={markup}
                anchorElement={this._decoElem}
                answerRender={this._params.answerRender}
                promptPresets={this._params.promptPresets}
                disablePromptPresets={this._getPluginState()?.disablePromptPresets}
                customPromptPlaceholder={this._params.customPromptPlaceholder}
                disabledPromptPlaceholder={this._params.disabledPromptPlaceholder}
                gptAlertProps={this._params.gptAlertProps}
                gptPopupContainer={this._params.gptPopupContainer}
                onApplyResult={this._onSubmit}
                onCustomPromptApply={this._params.onCustomPromptApply}
                onPromptPresetClick={this._params.onPromptPresetClick}
                onTryAgain={this._params.onTryAgain}
                onLike={this._params.onLike}
                onDislike={this._params.onDislike}
                onClose={this._onClose}
                onUpdate={this._onGptAnswerUpdate}
            />
        );
    }

    private _onGptAnswerUpdate: NonNullable<GptDialogProps<AnswerData, PromptData>['onUpdate']> = (
        answer,
    ) => {
        this._params.onUpdate?.(answer);
    };

    private _onSubmit: NonNullable<GptDialogProps['onApplyResult']> = (answer: string) => {
        const deco = this._getCurrentDecoration();

        if (!deco) return;

        const {from, to} = deco;

        const answerNode = this._params.host.parse(answer);

        const tr = this._view.state.tr;
        const meta: GptWidgetMeta = {action: 'hide'};

        tr.setMeta(pluginKey, meta);
        tr.replace(from, to, new Slice(answerNode.content, 1, 1));
        tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(to)));

        this._view.dispatch(tr);

        setTimeout(() => {
            if (!this._destroyed) this._view.focus();
        }, 0);

        this._params.onApplyResult?.(answer);

        this._resetState();
    };

    private _onClose = () => {
        const deco = this._getCurrentDecoration();

        if (!deco) {
            return;
        }

        const tr = this._view.state.tr;
        const meta: GptWidgetMeta = {action: 'hide'};

        tr.setSelection(TextSelection.create(tr.doc, deco.from, deco.to));

        tr.setMeta(pluginKey, meta);

        this._view.dispatch(tr);

        setTimeout(() => {
            if (!this._destroyed) this._view.focus();
        }, 0);

        this._params.onClose?.();

        this._resetState();
    };

    private _getContentOfDecoration(): string | undefined {
        const deco = this._getCurrentDecoration();

        if (!deco) return undefined;

        const {from, to} = deco;

        try {
            const fragment = this._view.state.doc.slice(from, to, true).content;
            const yfmMarkup = this._params.host.serialize(this._view.state.doc.copy(fragment));

            return yfmMarkup;
        } catch (error) {
            console.error(error);

            return this._view.state.doc.textBetween(from, to, '\n', '');
        }
    }

    private _getCurrentDecoration() {
        return this._getPluginState()?.decorations.find(
            undefined,
            undefined,
            (spec) => spec[WIDGET_DECO_SPEC_FLAG],
        )[0];
    }

    private _getPluginState() {
        return pluginKey.getState(this._view.state);
    }
}
