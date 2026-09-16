import {useLayoutEffect, useRef, useState} from 'react';

import {
    ArrowRightArrowLeft,
    ArrowUpFromSquare,
    ArrowUpRightFromSquare,
    Check,
    TrashBin,
} from '@gravity-ui/icons';
import {Button, Icon, Tooltip} from '@gravity-ui/uikit';

import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {UrlAction, UrlInput} from 'src/forms/UrlInput';
import {i18n as formsI18n} from 'src/i18n/forms';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {
    type HeaderActionAttrs,
    type HeaderActionTypeValue,
    type HeaderAttrs,
    HeaderBackground,
    MAX_HEADER_ACTIONS,
} from '../../HeaderSpecs';
import {toCssUrl} from '../../HeaderSpecs/dom';
import {
    findHeaderAction,
    removeHeaderActionAt,
    setHeaderActionAttrs,
    setHeaderAttrs,
    swapHeaderActions,
} from '../../commands';
import {getHeaderTargets, resolveHeaderTarget} from '../targets';

import {FillPalette, FillSwatch} from './FillPalette';
import {LayoutSettings} from './HeaderAppearance';
import {applyHeaderCommand, useUrlDraft} from './HeaderPopover';
import {useImageUpload} from './useImageUpload';

const b = cn('header-toolbar');
type TargetProps = {targetId: string; editorView: EditorView};

function useSettingsInput(autoFocus: boolean) {
    const ref = useRef<HTMLInputElement>(null);
    // Focus once on mount, without the delayed autofocus stealing later input.
    useLayoutEffect(() => {
        if (autoFocus) ref.current?.focus({preventScroll: true});
    }, [autoFocus]);
    return ref;
}

export function ImageSettings({
    targetId,
    editorView,
    fileUploadHandler,
    normalizeUrl,
}: TargetProps & {
    fileUploadHandler?: FileUploadHandler;
    normalizeUrl: (url: string) => string | null;
}) {
    const target = resolveHeaderTarget(editorView.state, targetId)!;
    const attrs = target.node.attrs as HeaderAttrs;
    const {pick, uploading} = useImageUpload(editorView, target.pos, fileUploadHandler);
    const update = (patch: Partial<HeaderAttrs>) => {
        const current = resolveHeaderTarget(editorView.state, targetId);
        if (current) applyHeaderCommand(editorView, setHeaderAttrs(current.pos, patch));
    };
    const normalize = (value: string) => {
        const url = normalizeUrl(value);
        return url && toCssUrl(url) ? url : null;
    };
    const draft = useUrlDraft(
        attrs.image,
        (image) => update({image, bg: image ? HeaderBackground.Image : HeaderBackground.Fill}),
        normalize,
        uploading,
    );
    const imageUrl = normalize(draft.value) || undefined;
    const inputRef = useSettingsInput(true);
    return (
        <div className={b('image')} aria-busy={uploading}>
            {(attrs.image || pick) && (
                <div className={b('image-heading')}>
                    {attrs.image && (
                        <div
                            className={b('image-preview')}
                            role="img"
                            aria-label={i18n('image.preview')}
                            style={{backgroundImage: toCssUrl(attrs.image) ?? undefined}}
                        />
                    )}
                    {pick && (
                        <Button
                            view="outlined"
                            loading={uploading}
                            onClick={() => {
                                draft.reset();
                                pick();
                            }}
                        >
                            <Icon data={ArrowUpFromSquare} size={16} />
                            {i18n(attrs.image ? 'image.replace' : 'image.upload')}
                        </Button>
                    )}
                    {attrs.image && (
                        <UrlAction
                            title={i18n('image.reset')}
                            icon={TrashBin}
                            disabled={uploading}
                            onClick={() => {
                                draft.reset();
                                update({image: '', bg: HeaderBackground.Fill});
                                draft.onSubmit();
                            }}
                        />
                    )}
                </div>
            )}
            <div className={b('field')}>
                <span className={b('field-label')}>{i18n('image.url')}</span>
                <UrlInput
                    value={draft.value}
                    onUpdate={draft.onUpdate}
                    onSubmit={draft.onSubmit}
                    controlRef={inputRef}
                    readOnly={uploading}
                    aria-label={i18n('image.url')}
                    placeholder="https://"
                    actions={
                        imageUrl ? (
                            <UrlAction
                                title={i18n('image.open')}
                                icon={ArrowUpRightFromSquare}
                                href={imageUrl}
                                onClick={draft.onSubmit}
                            />
                        ) : undefined
                    }
                />
            </div>
            {attrs.bg === HeaderBackground.Image && (
                <LayoutSettings value={attrs.layout} onChange={(layout) => update({layout})} />
            )}
        </div>
    );
}

export function ActionsSettings({
    editorView,
    normalizeUrl,
    onAdd,
}: {
    editorView: EditorView;
    normalizeUrl: (url: string) => string | null;
    onAdd: (type: HeaderActionTypeValue) => void;
}) {
    const targets = getHeaderTargets(editorView.state);
    const [focusedId] = useState(() => {
        const selected = findHeaderAction(editorView.state);
        return (
            targets?.actions.find((target) => target.pos === selected?.pos)?.id ??
            targets?.actions[0]?.id
        );
    });
    const count = targets?.actions.length ?? 0;
    return (
        <div className={b('actions')}>
            <div className={b('actions-heading')}>
                <span className={b('actions-limit')}>
                    {i18n('cta.count', {count, max: MAX_HEADER_ACTIONS})}
                </span>
                {count === 2 && (
                    <Button
                        view="flat"
                        onClick={() => {
                            const current = getHeaderTargets(editorView.state);
                            if (current)
                                applyHeaderCommand(
                                    editorView,
                                    swapHeaderActions(current.header.pos),
                                );
                        }}
                    >
                        <Icon data={ArrowRightArrowLeft} size={16} />
                        {i18n('cta.swap')}
                    </Button>
                )}
            </div>
            {!targets?.actions.length && (
                <div className={b('actions-empty')}>{i18n('cta.empty')}</div>
            )}
            {targets?.actions.map((target, index) => (
                <ActionSettings
                    key={target.id}
                    targetId={target.id}
                    index={index}
                    editorView={editorView}
                    normalizeUrl={normalizeUrl}
                    autoFocus={target.id === focusedId}
                />
            ))}
            {count < MAX_HEADER_ACTIONS && (
                <div className={b('actions-footer')}>
                    <div className={b('actions-add')}>
                        <Button view="outlined" onClick={() => onAdd('button')}>
                            {i18n('cta.add')}
                        </Button>
                        <Button view="outlined" onClick={() => onAdd('link')}>
                            {i18n('cta.add_link')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionSettings({
    targetId,
    index,
    editorView,
    normalizeUrl,
    autoFocus,
}: TargetProps & {
    normalizeUrl: (url: string) => string | null;
    autoFocus: boolean;
    index: number;
}) {
    const target = resolveHeaderTarget(editorView.state, targetId)!;
    const {href, type, color} = target.node.attrs as HeaderActionAttrs;
    const title =
        target.node.textContent || i18n(type === 'link' ? 'cta.type_link' : 'cta.type_button');
    const update = (patch: Partial<HeaderActionAttrs>) => {
        const current = resolveHeaderTarget(editorView.state, targetId);
        if (current) applyHeaderCommand(editorView, setHeaderActionAttrs(current.pos, patch));
    };
    const draft = useUrlDraft(href, (url) => update({href: url}), normalizeUrl);
    const discardAndSubmit = () => {
        draft.reset();
        if (draft.onSubmit()) return true;
        draft.onUpdate(draft.value);
        return false;
    };
    const url = normalizeUrl(draft.value) || undefined;
    const inputRef = useSettingsInput(autoFocus);
    return (
        <div className={b('action')} role="group" aria-label={title}>
            <div className={b('action-heading')}>
                <span className={b('action-number')} aria-hidden>
                    {index + 1}
                </span>
                <span className={b('action-title')} title={title}>
                    {title}
                </span>
                <div role="group" aria-label={i18n('cta.type')} className={b('action-kind')}>
                    {(['button', 'link'] as const).map((kind) => (
                        <Button
                            key={kind}
                            view="flat"
                            size="m"
                            selected={type === kind}
                            aria-pressed={type === kind}
                            onClick={() => update({type: kind})}
                        >
                            {i18n(kind === 'link' ? 'cta.type_link' : 'cta.type_button')}
                        </Button>
                    ))}
                </div>
                <UrlAction
                    title={i18n('cta.remove')}
                    icon={TrashBin}
                    onClick={() => {
                        const current = resolveHeaderTarget(editorView.state, targetId);
                        if (!discardAndSubmit()) return;
                        if (current)
                            applyHeaderCommand(editorView, removeHeaderActionAt(current.pos));
                        editorView.focus();
                    }}
                />
            </div>
            <div className={b('field')}>
                <span className={b('field-label')}>{i18n('cta.href')}</span>
                <UrlInput
                    value={draft.value}
                    onUpdate={draft.onUpdate}
                    onSubmit={draft.onSubmit}
                    controlRef={inputRef}
                    aria-label={i18n('cta.href')}
                    placeholder={formsI18n('link-href-placeholder')}
                    actions={
                        url ? (
                            <UrlAction
                                title={formsI18n('link_open_help')}
                                icon={ArrowUpRightFromSquare}
                                href={url}
                                onClick={draft.onSubmit}
                            />
                        ) : undefined
                    }
                />
            </div>
            {type === 'button' && (
                <div className={b('action-color')} role="group" aria-label={i18n('cta.color')}>
                    <span className={b('action-color-label')}>{i18n('cta.color')}</span>
                    <div className={b('action-color-options')}>
                        <Tooltip content={i18n('cta.color_default')}>
                            <button
                                type="button"
                                className={b('default-color')}
                                aria-label={i18n('cta.color_default')}
                                aria-pressed={color === 'brand'}
                                onClick={() => update({color: 'brand'})}
                            >
                                <FillSwatch value="brand">
                                    {color === 'brand' && <Icon data={Check} size={16} />}
                                </FillSwatch>
                            </button>
                        </Tooltip>
                        <FillPalette
                            value={color === 'brand' ? undefined : color}
                            onSelect={(value) => update({color: value})}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
