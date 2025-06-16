import {useCallback} from 'react';

import {Popup} from '@gravity-ui/uikit';
import type {PopupProps} from '@gravity-ui/uikit';
import {Slice} from 'prosemirror-model';
import type {PluginView} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';
import {useMount} from 'react-use';

import {cn} from '../../../../classname';
import type {Parser, Serializer} from '../../../../core';
import {getReactRendererFromState} from '../../../behavior';
import type {CommonAnswer} from '../ErrorScreen/types';
import type {GptDialogProps} from '../GptDialog/GptDialog';
import {GptDialog} from '../GptDialog/GptDialog';
import {WIDGET_DECO_CLASS_NAME, WIDGET_DECO_SPEC_FLAG, gptPopupPlacement} from '../constants';
import type {GptWidgetMeta} from '../plugin';
import {pluginKey} from '../plugin';

import './view.scss';

export const cnGptPopup = cn('gpt-popup');

export type GptWidgetDecoViewParams<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Omit<GptDialogProps<AnswerData, PromptData>, 'markup' | 'onApplyResult'> & {
    serializer: Serializer;
    parser: Parser;
} & {
    onApplyResult?: GptDialogProps['onApplyResult'];
};

export class GptWidgetDecoView<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> implements Required<PluginView>
{
    private readonly _view;
    private readonly _renderer;

    private _decoElem: Element | null = null;
    private _params: GptWidgetDecoViewParams<AnswerData, PromptData>;
    private _serializer: Serializer;
    private _parser: Parser;
    private _confirmOpen: boolean;

    constructor(view: EditorView, params: GptWidgetDecoViewParams<AnswerData, PromptData>) {
        this._view = view;

        this._params = params;
        this._serializer = params.serializer;
        this._parser = params.parser;
        this._confirmOpen = false;

        this._renderer = getReactRendererFromState(view.state).createItem(
            'gpt-widget-view',
            this._render.bind(this),
        );
    }

    update(view: EditorView): void {
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
        this._confirmOpen = false;
    }

    private _onConfirmCancel = () => {
        this._confirmOpen = false;

        this._renderer.rerender();
    };

    private _onConfirmOk = () => {
        this._onClose();
    };

    private _render() {
        if (!this._decoElem) return null;

        const markup = this._getContentOfDecoration();

        if (markup === undefined) {
            return null;
        }

        return (
            <Widget
                markup={markup}
                anchorElement={this._decoElem}
                answerRender={this._params.answerRender}
                promptPresets={this._params.promptPresets}
                disablePromptPresets={this._params.disablePromptPresets}
                customPromptPlaceholder={this._params.customPromptPlaceholder}
                disabledPromptPlaceholder={this._params.disabledPromptPlaceholder}
                gptAlertProps={this._params.gptAlertProps}
                onApplyResult={this._onSubmit}
                onCustomPromptApply={this._params.onCustomPromptApply}
                onPromptPresetClick={this._params.onPromptPresetClick}
                onTryAgain={this._params.onTryAgain}
                onLike={this._params.onLike}
                onDislike={this._params.onDislike}
                onClose={this._onClose}
                onUpdate={this._onGptAnswerUpdate}
                confirmOpen={this._confirmOpen}
                onConfirmOk={this._onConfirmOk}
                onConfirmCancel={this._onConfirmCancel}
            />
        );
    }

    private _onGptAnswerUpdate: NonNullable<WidgetProps<AnswerData, PromptData>['onUpdate']> = (
        answer,
    ) => {
        this._params.onUpdate?.(answer);
    };

    private _onSubmit: NonNullable<WidgetProps['onApplyResult']> = (answer: string) => {
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

        setTimeout(() => {
            this._view.focus();
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
            this._view.focus();
        }, 0);

        this._params.onClose?.();

        this._resetState();
    };

    private _getContentOfDecoration(): string | undefined {
        const deco = this._getCurrentDecoration();

        if (!deco) return undefined;

        const {from, to} = deco;

        try {
            // FIXME: Verify and use Node instead of Fragment
            const fragment = this._view.state.doc.slice(from, to, true).content;
            const yfmMarkup = this._serializer.serialize(fragment as any);

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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
            (spec) => spec[WIDGET_DECO_SPEC_FLAG],
        )[0];
    }

    private _getPluginState() {
        return pluginKey.getState(this._view.state);
    }
}

type WidgetProps<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
> = Pick<PopupProps, 'anchorElement'> & {
    markup: string;
    onClose: () => void;
    confirmOpen: boolean;
    onConfirmOk: () => void;
    onConfirmCancel: () => void;
} & GptDialogProps<AnswerData, PromptData>;

function Widget<
    AnswerData extends CommonAnswer = CommonAnswer,
    PromptData extends unknown = unknown,
>({
    markup,
    anchorElement,
    answerRender,
    promptPresets,
    disablePromptPresets,
    customPromptPlaceholder,
    disabledPromptPlaceholder,
    onCustomPromptApply,
    onApplyResult,
    onPromptPresetClick,
    onTryAgain,
    onLike,
    onDislike,
    onClose,
    onUpdate,
    gptAlertProps,
}: WidgetProps<AnswerData, PromptData>) {
    useMount(() => {
        if (anchorElement && 'scrollIntoView' in anchorElement) {
            anchorElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    });

    const handleUpdate = useCallback(
        (result?: AnswerData) => {
            onUpdate?.(result);
        },
        [onUpdate],
    );

    return (
        <>
            <Popup
                className={cnGptPopup()}
                open
                anchorElement={anchorElement}
                placement={gptPopupPlacement}
                onOpenChange={(_open, _event, reason) => {
                    if (reason === 'outside-press' || reason === 'escape-key') {
                        onClose();
                    }
                }}
                strategy="absolute"
            >
                <div className={cnGptPopup('content')}>
                    <GptDialog
                        markup={markup}
                        answerRender={answerRender}
                        promptPresets={promptPresets}
                        disablePromptPresets={disablePromptPresets}
                        customPromptPlaceholder={customPromptPlaceholder}
                        disabledPromptPlaceholder={disabledPromptPlaceholder}
                        onApplyResult={onApplyResult}
                        onCustomPromptApply={onCustomPromptApply}
                        onPromptPresetClick={onPromptPresetClick}
                        onTryAgain={onTryAgain}
                        onLike={onLike}
                        onDislike={onDislike}
                        onClose={onClose}
                        onUpdate={handleUpdate}
                        gptAlertProps={gptAlertProps}
                    />
                </div>
            </Popup>
        </>
    );
}
