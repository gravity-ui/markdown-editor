import {Slice} from 'prosemirror-model';
import type {EditorState, PluginView} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

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
    private _session: object | undefined;
    private _sessionId = 0;
    private _params: GptWidgetDecoViewParams<AnswerData, PromptData>;
    private _serializer: WysiwygGptHost['serializer'];
    private _parser: WysiwygGptHost['parser'];

    constructor(view: EditorView, params: GptWidgetDecoViewParams<AnswerData, PromptData>) {
        this._view = view;

        this._params = params;
        this._serializer = params.serializer;
        this._parser = params.parser;

        this._renderer = params
            .getRenderer(view.state)
            .createItem('gpt-widget-view', this._render.bind(this));
    }

    update(view: EditorView, _prevState: EditorState): void {
        const spec = this._getCurrentDecoration()?.spec;
        if (spec !== this._session) {
            this._session = spec;
            this._sessionId++;
        }

        const decoElements = Array.from(view.dom.querySelectorAll(`.${WIDGET_DECO_CLASS_NAME}`));

        this._decoElem = decoElements.at(-1) ?? null;
        this._renderer.rerender();
    }

    destroy(): void {
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

        const sessionId = this._sessionId;
        return (
            <GptPopup
                key={this._sessionId}
                markup={markup}
                anchorElement={this._decoElem}
                answerRender={this._params.answerRender}
                promptPresets={this._params.promptPresets}
                disablePromptPresets={this._params.disablePromptPresets}
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
                    if (sessionId === this._sessionId) this._onGptAnswerUpdate(answer);
                }}
            />
        );
    }

    private _onGptAnswerUpdate: NonNullable<GptDialogProps<AnswerData, PromptData>['onUpdate']> = (
        answer,
    ) => {
        if (this._getCurrentDecoration()) this._params.onUpdate?.(answer);
    };

    private _onSubmit: NonNullable<GptDialogProps['onApplyResult']> = (answer: string) => {
        const deco = this._getCurrentDecoration();

        if (!deco) return;

        const {from, to} = deco;

        const answerNode = this._parser.parse(answer);

        const tr = this._view.state.tr;
        const meta: GptWidgetMeta = {action: 'hide'};

        tr.setMeta(pluginKey, meta);
        tr.replace(from, to, new Slice(answerNode.content, 1, 1));
        tr.setSelection(TextSelection.create(tr.doc, tr.mapping.map(to)));

        this._view.dispatch(tr);

        this._view.dom.focus({preventScroll: true});

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

        this._view.dom.focus({preventScroll: true});

        this._params.onClose?.();

        this._resetState();
    };

    private _getContentOfDecoration(): string | undefined {
        const deco = this._getCurrentDecoration();

        if (!deco) return undefined;

        const {from, to} = deco;

        try {
            const fragment = this._view.state.doc.slice(from, to, true).content;
            const document = this._view.state.doc.copy(fragment);
            const yfmMarkup = this._serializer.serialize(document);

            return yfmMarkup;
        } catch (error) {
            console.error(error);

            return this._view.state.doc.textBetween(from, to, '\n', '');
        }
    }

    private _getCurrentDecoration() {
        return this._getPluginState()?.find(
            undefined,
            undefined,
            (spec) => spec[WIDGET_DECO_SPEC_FLAG],
        )[0];
    }

    private _getPluginState() {
        return pluginKey.getState(this._view.state);
    }
}
