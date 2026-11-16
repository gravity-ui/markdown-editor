import {Slice} from 'prosemirror-model';
import type {EditorState, PluginView} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
import type {Decoration, EditorView} from 'prosemirror-view';

import {GptPopup} from '../../../components/GptPopup/GptPopup';
import {WIDGET_DECO_CLASS_NAME, WIDGET_DECO_SPEC_FLAG} from '../../../constants';
import type {WysiwygGptHost} from '../../../host';
import type {CommonAnswer, GptDialogProps} from '../../../types';

import type {GptWidgetMeta} from './plugin-key';
import {pluginKey} from './plugin-key';

import './view.scss';

export {cnGptPopup} from '../../../components/GptPopup/GptPopup';

export type GptWidgetDecoViewParams<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Omit<GptDialogProps<AnswerData, PromptData>, 'markup' | 'onApplyResult'> & {
    serializer: WysiwygGptHost['serializer'];
    parser: WysiwygGptHost['parser'];
    getRenderer: WysiwygGptHost['getRenderer'];
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
    private _sessionId = 0;
    private readonly _params: GptWidgetDecoViewParams<AnswerData, PromptData>;

    constructor(view: EditorView, params: GptWidgetDecoViewParams<AnswerData, PromptData>) {
        this._view = view;

        this._params = params;

        this._renderer = params
            .getRenderer(view.state)
            .createItem('gpt-widget-view', this._render.bind(this));
    }

    update(view: EditorView, previous: EditorState): void {
        const decoration = this._getCurrentDecoration();
        const previousDecoration = this._getCurrentDecoration(previous);
        if (!decoration && !previousDecoration) return;
        if (decoration?.spec !== previousDecoration?.spec) {
            this._sessionId++;
        }

        const decoElements = Array.from(view.dom.querySelectorAll(`.${WIDGET_DECO_CLASS_NAME}`));

        this._decoElem = decoElements.at(-1) ?? null;
        this._renderer.rerender();
    }

    destroy(): void {
        this._sessionId++;
        this._decoElem = null;
        this._renderer.remove();
    }

    private _render() {
        const decoration = this._getCurrentDecoration();
        if (!this._decoElem || !decoration) return null;

        const markup = this._getContentOfDecoration(decoration);
        const sessionId = this._sessionId;
        return (
            <GptPopup
                key={this._sessionId}
                markup={markup}
                anchorElement={this._decoElem}
                answerRender={this._params.answerRender}
                promptPresets={this._params.promptPresets}
                disablePromptPresets={decoration.from === decoration.to}
                customPromptPlaceholder={this._params.customPromptPlaceholder}
                disabledPromptPlaceholder={this._params.disabledPromptPlaceholder}
                gptAlertProps={this._params.gptAlertProps}
                onApplyResult={(answer) => {
                    if (sessionId === this._sessionId) this._onSubmit(answer);
                }}
                onCustomPromptApply={this._params.onCustomPromptApply}
                onPromptPresetClick={this._params.onPromptPresetClick}
                onTryAgain={this._params.onTryAgain}
                onLike={this._params.onLike}
                onDislike={this._params.onDislike}
                onClose={() => {
                    if (sessionId === this._sessionId) this._onClose();
                }}
                onUpdate={(answer) => {
                    if (sessionId === this._sessionId) this._params.onUpdate?.(answer);
                }}
            />
        );
    }

    private _onSubmit: NonNullable<GptDialogProps['onApplyResult']> = (answer: string) => {
        const deco = this._getCurrentDecoration();

        if (!deco) return;

        const {from, to} = deco;

        const answerNode = this._params.parser.parse(answer);

        const tr = this._view.state.tr;
        const meta: GptWidgetMeta = {action: 'hide'};

        tr.setMeta(pluginKey, meta);
        tr.replace(from, to, new Slice(answerNode.content, 1, 1));
        tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(to)));

        this._view.dispatch(tr);

        this._view.dom.focus({preventScroll: true});

        this._params.onApplyResult?.(answer);
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

        this._view.dom.focus({preventScroll: true});

        this._params.onClose?.();
    };

    private _getContentOfDecoration(deco: Decoration): string {
        const {from, to} = deco;

        try {
            const fragment = this._view.state.doc.slice(from, to, true).content;
            const document = this._view.state.doc.copy(fragment);
            return this._params.serializer.serialize(document);
        } catch (error) {
            console.error(error);

            return this._view.state.doc.textBetween(from, to, '\n', '');
        }
    }

    private _getCurrentDecoration(state = this._view.state) {
        return pluginKey
            .getState(state)
            ?.find(undefined, undefined, (spec) => spec[WIDGET_DECO_SPEC_FLAG])[0];
    }
}
