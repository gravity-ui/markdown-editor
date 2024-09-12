import React, {useCallback, useEffect} from 'react';

import {Popup} from '@gravity-ui/uikit';
import type {PopupProps} from '@gravity-ui/uikit';
import {Slice} from 'prosemirror-model';
import type {EditorState, PluginView} from 'prosemirror-state';
import {TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {useMount} from 'react-use';

import {Parser, Serializer} from 'src/core';

import {cn} from '../../../../classname';
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
    gptPopupContainer?: PopupProps['container'];
};

export class GptWidgetDecoView implements Required<PluginView> {
    private readonly _view;
    private readonly _renderer;

    private _decoElem: Element | null = null;
    private _params: GptWidgetDecoViewParams;
    private _serializer: Serializer;
    private _parser: Parser;
    private _confirmOpen: boolean;

    constructor(view: EditorView, params: GptWidgetDecoViewParams) {
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

    update(view: EditorView, prevState: EditorState): void {
        const {state, dispatch} = view;

        if (this._decoElem && !state.selection.eq(prevState.selection)) {
            const transaction = state.tr;
            const meta: GptWidgetMeta = {action: 'hide'};

            dispatch(transaction.setMeta(pluginKey, meta));
            this._view.focus();

            return;
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
                anchorRef={{current: this._decoElem}}
                answerRender={this._params.answerRender}
                promptPresets={this._params.promptPresets}
                disablePromptPresets={this._params.disablePromptPresets}
                customPromptPlaceholder={this._params.customPromptPlaceholder}
                disabledPromptPlaceholder={this._params.disabledPromptPlaceholder}
                gptAlertProps={this._params.gptAlertProps}
                /* eslint-disable-next-line react/jsx-handler-names */
                onApplyResult={this._onSubmit}
                /* eslint-disable-next-line react/jsx-handler-names */
                onCustomPromptApply={this._params.onCustomPromptApply}
                /* eslint-disable-next-line react/jsx-handler-names */
                onPromptPresetClick={this._params.onPromptPresetClick}
                /* eslint-disable-next-line react/jsx-handler-names */
                onTryAgain={this._params.onTryAgain}
                /* eslint-disable-next-line react/jsx-handler-names */
                onLike={this._params.onLike}
                /* eslint-disable-next-line react/jsx-handler-names */
                onDislike={this._params.onDislike}
                /* eslint-disable-next-line react/jsx-handler-names */
                onClose={this._onClose}
                /* eslint-disable-next-line react/jsx-handler-names */
                onUpdate={this._onGptAnswerUpdate}
                /* eslint-disable-next-line react/jsx-handler-names */
                confirmOpen={this._confirmOpen}
                /* eslint-disable-next-line react/jsx-handler-names */
                onConfirmOk={this._onConfirmOk}
                /* eslint-disable-next-line react/jsx-handler-names */
                onConfirmCancel={this._onConfirmCancel}
                container={this._params.gptPopupContainer}
            />
        );
    }

    private _onGptAnswerUpdate: NonNullable<WidgetProps['onUpdate']> = (answer) => {
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
            const fragment = this._view.state.doc.slice(from, to, true).content;
            const yfmMarkup = this._serializer.serialize(fragment);

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

type WidgetProps = Pick<PopupProps, 'anchorRef' | 'container'> & {
    markup: string;
    onClose: () => void;
    confirmOpen: boolean;
    onConfirmOk: () => void;
    onConfirmCancel: () => void;
} & GptDialogProps;

function Widget({
    markup,
    anchorRef,
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
    container,
    gptAlertProps,
}: WidgetProps) {
    useEffect(() => {
        // rerender the popup
        window.dispatchEvent(new CustomEvent('scroll'));
    }, [anchorRef]);

    useMount(() => {
        if (anchorRef?.current && 'scrollIntoView' in anchorRef.current) {
            anchorRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    });

    const handleUpdate = useCallback(
        (result?: CommonAnswer) => {
            onUpdate?.(result);
            requestAnimationFrame(() => {
                // rerender the popup
                window.dispatchEvent(new CustomEvent('scroll'));
            });
        },
        [onUpdate],
    );

    return (
        <>
            <Popup
                className={cnGptPopup()}
                contentClassName={cnGptPopup('content')}
                open
                anchorRef={anchorRef}
                placement={gptPopupPlacement}
                onOutsideClick={onClose}
                focusTrap
                strategy="absolute"
                container={container}
                onEscapeKeyDown={onClose}
            >
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
            </Popup>
        </>
    );
}
