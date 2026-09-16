import {useState} from 'react';

import {ArrowUpFromSquare, ArrowUpRightFromSquare, LinkSlash, TrashBin} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';

import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {UrlAction, UrlInput} from 'src/forms/UrlInput';
import {i18n as formsI18n} from 'src/i18n/forms';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {type HeaderAttrs, HeaderBackground} from '../../HeaderSpecs';
import {toCssUrl} from '../../HeaderSpecs/dom';
import {
    findHeaderAction,
    removeHeaderActionAt,
    setHeaderActionAttrs,
    setHeaderAttrs,
} from '../../commands';
import {getHeaderTargets, resolveHeaderTarget} from '../targets';

import {LayoutSettings} from './HeaderAppearance';
import {applyHeaderCommand, useUrlDraft} from './HeaderPopover';
import {useImageUpload} from './useImageUpload';

const b = cn('header-toolbar');
type TargetProps = {targetId: string; editorView: EditorView};

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
    return (
        <div className={b('image')}>
            <UrlInput
                value={draft.value}
                onUpdate={draft.onUpdate}
                onSubmit={draft.onSubmit}
                autoFocus
                disabled={uploading}
                aria-label={i18n('image.url')}
                placeholder={i18n('image.url')}
                actions={
                    pick || attrs.image || imageUrl ? (
                        <>
                            {pick && (
                                <UrlAction
                                    title={i18n('image.upload')}
                                    icon={ArrowUpFromSquare}
                                    loading={uploading}
                                    onClick={() => {
                                        draft.reset();
                                        pick();
                                    }}
                                />
                            )}
                            {attrs.image && (
                                <UrlAction
                                    title={i18n('image.reset')}
                                    icon={LinkSlash}
                                    disabled={uploading}
                                    onClick={() => {
                                        draft.reset();
                                        update({image: '', bg: HeaderBackground.Fill});
                                        draft.onSubmit();
                                    }}
                                />
                            )}
                            {imageUrl && (
                                <UrlAction
                                    title={i18n('image.open')}
                                    icon={ArrowUpRightFromSquare}
                                    href={imageUrl}
                                    onClick={draft.onSubmit}
                                />
                            )}
                        </>
                    ) : undefined
                }
            />
            {attrs.bg === HeaderBackground.Image && (
                <LayoutSettings value={attrs.layout} onChange={(layout) => update({layout})} />
            )}
        </div>
    );
}

export function ActionsSettings({
    editorView,
    normalizeUrl,
}: {
    editorView: EditorView;
    normalizeUrl: (url: string) => string | null;
}) {
    const targets = getHeaderTargets(editorView.state);
    const [focusedId] = useState(() => {
        const selected = findHeaderAction(editorView.state);
        return (
            targets?.actions.find((target) => target.pos === selected?.pos)?.id ??
            targets?.actions[0]?.id
        );
    });
    return (
        <div className={b('actions')}>
            {targets?.actions.map((target) => (
                <ActionSettings
                    key={target.id}
                    targetId={target.id}
                    editorView={editorView}
                    normalizeUrl={normalizeUrl}
                    autoFocus={target.id === focusedId}
                />
            ))}
        </div>
    );
}

function ActionSettings({
    targetId,
    editorView,
    normalizeUrl,
    autoFocus,
}: TargetProps & {
    normalizeUrl: (url: string) => string | null;
    autoFocus: boolean;
}) {
    const target = resolveHeaderTarget(editorView.state, targetId)!;
    const {href, type} = target.node.attrs;
    const title =
        target.node.textContent || i18n(type === 'link' ? 'cta.type_link' : 'cta.type_button');
    const update = (patch: {href?: string; type?: 'button' | 'link'}) => {
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
    return (
        <div className={b('action')} role="group" aria-label={title}>
            <div className={b('action-heading')}>
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
            <UrlInput
                value={draft.value}
                onUpdate={draft.onUpdate}
                onSubmit={draft.onSubmit}
                autoFocus={autoFocus}
                aria-label={i18n('cta.href')}
                placeholder={formsI18n('link-href-placeholder')}
                actions={
                    url ? (
                        <>
                            <UrlAction
                                title={formsI18n('link_remove_help')}
                                icon={LinkSlash}
                                onClick={() => {
                                    if (discardAndSubmit()) update({href: ''});
                                }}
                            />
                            <UrlAction
                                title={formsI18n('link_open_help')}
                                icon={ArrowUpRightFromSquare}
                                href={url}
                                onClick={draft.onSubmit}
                            />
                        </>
                    ) : undefined
                }
            />
        </div>
    );
}
