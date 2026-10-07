import {useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode, RefObject} from 'react';

import {getStyles} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {TrashBin} from '@gravity-ui/icons';
import {Button, Icon, SegmentedRadioGroup} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {SharedStateKey} from 'src/extensions/behavior/SharedState';
import {i18n} from 'src/i18n/common';
import {i18n as htmlBlockI18n} from 'src/i18n/yfm-html-block';
import {useAutoSave} from 'src/react-utils/hooks';
import {useSharedEditingState} from 'src/react-utils/useSharedEditingState';
import {removeNode} from 'src/utils/remove-node';

import {YfmHtmlBlockConsts} from '../YfmHtmlBlockSpecs/const';
import type {YfmHtmlBlockOptions} from '../index';
import type {YfmHtmlBlockEntitySharedState} from '../types';

import {FrameInlineEditing} from './FrameInlineEditing';
import {HtmlSourceEditor} from './HtmlSourceEditor';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock} from './const';

import './YfmHtmlBlock.scss';

const b = cnYfmHtmlBlock;

type ViewMode = 'editor' | 'code';

const HtmlBlockToolbar: React.FC<{
    mode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
    onRemove: () => void;
    modeSwitchDisabled?: boolean;
    actions?: ReactNode;
    actionsRef?: (element: HTMLDivElement | null) => void;
    panelRef?: (element: HTMLDivElement | null) => void;
}> = ({mode, onModeChange, onRemove, modeSwitchDisabled, actions, actionsRef, panelRef}) => (
    <div className={b('header')}>
        <div className={`${b('toolbar')} ${STOP_EVENT_CLASSNAME}`}>
            <SegmentedRadioGroup<ViewMode>
                size="m"
                value={mode}
                onUpdate={onModeChange}
                aria-label={i18n('view_mode')}
            >
                <SegmentedRadioGroup.Option value="editor">
                    {htmlBlockI18n('visual')}
                </SegmentedRadioGroup.Option>
                <SegmentedRadioGroup.Option value="code" disabled={modeSwitchDisabled}>
                    {i18n('code')}
                </SegmentedRadioGroup.Option>
            </SegmentedRadioGroup>
            <div ref={actionsRef} className={b('toolbar-actions')}>
                {actions}
            </div>
            <Button
                view="flat-danger"
                size="m"
                aria-label={i18n('remove')}
                title={i18n('remove')}
                onClick={onRemove}
            >
                <Icon data={TrashBin} size={16} />
            </Button>
        </div>
        <div ref={panelRef}>
            {mode === 'editor' && !modeSwitchDisabled && (
                <div className={`${b('hint')} ${b('instruction')}`}>
                    {htmlBlockI18n('select_element')}
                </div>
            )}
        </div>
    </div>
);

interface YfmHtmlBlockViewProps {
    html: string;
    onDoubleClick?: () => void;
    config?: IHTMLIFrameElementConfig;
    frameRef: RefObject<HTMLIFrameElement>;
}

const DEFAULT_PADDING = 20;

const YfmHtmlBlockPreview: React.FC<YfmHtmlBlockViewProps> = ({
    html,
    onDoubleClick,
    config,
    frameRef: ref,
}) => {
    const styles = useRef<Record<string, string>>({});
    const classNames = useRef<string[]>([]);
    const [height, setHeight] = useState('100%');

    useEffect(() => {
        const frame = ref.current;
        if (!frame) return undefined;
        let frameDocument: Document | null = null;
        const resize = () => {
            const body = frame.contentDocument?.body;
            if (body) setHeight(`${body.scrollHeight + DEFAULT_PADDING}px`);
        };
        const resizeObserver = new ResizeObserver(resize);
        const onLinkClick = (event: MouseEvent) => {
            const link = (event.target as Element).closest('a[href^="#"]');
            if (!link) return;
            event.preventDefault();
            const id = link.getAttribute('href')?.slice(1);
            if (id) frameDocument?.getElementById(id)?.scrollIntoView({behavior: 'smooth'});
        };
        const connect = () => {
            frameDocument?.removeEventListener('click', onLinkClick);
            if (onDoubleClick) frameDocument?.removeEventListener('dblclick', onDoubleClick);
            resizeObserver.disconnect();
            const currentDocument = frame.contentDocument;
            frameDocument = currentDocument;
            const body = currentDocument?.body;
            if (!currentDocument || !body) return;

            const nextClasses = config?.classNames ?? [];
            classNames.current.forEach((name) => {
                if (!nextClasses.includes(name)) body.classList.remove(name);
            });
            nextClasses.forEach((name) => body.classList.add(name));
            classNames.current = nextClasses;

            const nextStyles = config?.styles ?? {};
            Object.keys(styles.current).forEach((name) => {
                if (!(name in nextStyles)) body.style.removeProperty(name);
            });
            Object.entries(nextStyles).forEach(([name, value]) =>
                body.style.setProperty(name, value),
            );
            styles.current = nextStyles;

            currentDocument.addEventListener('click', onLinkClick);
            if (onDoubleClick) currentDocument.addEventListener('dblclick', onDoubleClick);
            resizeObserver.observe(frame);
            resizeObserver.observe(body);
            body.querySelectorAll('img').forEach((image) => resizeObserver.observe(image));
            resize();
        };
        frame.addEventListener('load', connect);
        connect();
        return () => {
            frame.removeEventListener('load', connect);
            frameDocument?.removeEventListener('click', onLinkClick);
            if (onDoubleClick) frameDocument?.removeEventListener('dblclick', onDoubleClick);
            resizeObserver.disconnect();
        };
    }, [config, html, onDoubleClick, ref]);

    return (
        <iframe
            style={{
                height,
            }}
            ref={ref}
            title={i18n('editor')}
            frameBorder={0}
            scrolling="no"
            className={b('content')}
            srcDoc={html}
        />
    );
};

const CodeEditMode: React.FC<{
    initialText: string;
    onSave: (v: string) => void;
    onCancel: () => void;
    onRemove: () => void;
    options: YfmHtmlBlockOptions;
}> = ({initialText, onSave, onCancel, onRemove, options: {autoSave}}) => {
    const {value, handleChange, handleManualSave, hasUnsavedChanges, isAutoSaveEnabled} =
        useAutoSave({initialValue: initialText || '\n', onSave, onClose: onCancel, autoSave});

    const closeWithChanges = () => {
        if (hasUnsavedChanges) handleManualSave();
        else onCancel();
    };

    return (
        <div className={b({editing: true})}>
            <HtmlBlockToolbar
                mode="code"
                onModeChange={(mode) => {
                    if (mode === 'editor') closeWithChanges();
                }}
                onRemove={onRemove}
                actions={
                    <>
                        <Button onClick={onCancel} view="flat">
                            {isAutoSaveEnabled ? i18n('close') : i18n('cancel')}
                        </Button>
                        <Button onClick={closeWithChanges} view="action">
                            {i18n('save')}
                        </Button>
                    </>
                }
            />
            <div className={b('body')}>
                <HtmlSourceEditor value={value} onUpdate={handleChange} />
            </div>
        </div>
    );
};

export const YfmHtmlBlockView: React.FC<{
    getPos: () => number | undefined;
    node: Node;
    onChange: (attrs: {[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: string}) => void;
    options: YfmHtmlBlockOptions;
    view: EditorView;
}> = ({onChange, node, getPos, view, options}) => {
    const {
        useConfig,
        sanitize,
        styles,
        baseTarget = '_parent',
        head: headContent = '',
        openCodeOnDoubleClick = false,
    } = options;
    const entityId: string = node.attrs[YfmHtmlBlockConsts.NodeAttrs.EntityId];
    const entityKey = useMemo(
        () => SharedStateKey.define<YfmHtmlBlockEntitySharedState>({name: entityId}),
        [entityId],
    );

    const config = useConfig?.();

    const [editing, setEditing, unsetEditing] = useSharedEditingState(view, entityKey);
    const blockRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLIFrameElement>(null);
    const [toolbarActions, setToolbarActions] = useState<HTMLDivElement | null>(null);
    const [panelContainer, setPanelContainer] = useState<HTMLDivElement | null>(null);
    const [elementEditing, setElementEditing] = useState(false);
    const sourceHtml: string = node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc] ?? '';

    const openCode = () => {
        if (!elementEditing) setEditing();
    };

    const onRemove = () => {
        const pos = getPos();
        if (pos === undefined) return;
        removeNode({
            node,
            pos,
            tr: view.state.tr,
            dispatch: view.dispatch,
        });
    };

    if (editing) {
        return (
            <CodeEditMode
                initialText={node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc]}
                onCancel={unsetEditing}
                onSave={(v) => {
                    onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: v});
                }}
                onRemove={onRemove}
                options={options}
            />
        );
    }

    let additional = baseTarget ? `<base target="${baseTarget}">` : '';
    if (styles) {
        const stylesContent =
            typeof styles === 'string'
                ? `<link rel="stylesheet" href="${styles}" />`
                : `<style>${getStyles(styles)}</style>`;
        additional += stylesContent;
    }

    const head = `<head>${headContent || additional}</head>`;
    const body = `<body>${sourceHtml}</body>`;
    const html = `<!DOCTYPE html><html>${head}${body}</html>`;

    const sanitizeFunction = typeof sanitize === 'function' ? sanitize : sanitize?.body;

    const resultHtml = sanitizeFunction ? sanitizeFunction(html) : html;

    return (
        <div
            ref={blockRef}
            className={b()}
            tabIndex={-1}
            onDoubleClick={
                openCodeOnDoubleClick
                    ? (event) => {
                          if ((event.target as HTMLElement).closest(`.${STOP_EVENT_CLASSNAME}`))
                              return;
                          openCode();
                      }
                    : undefined
            }
        >
            <HtmlBlockToolbar
                mode="editor"
                onModeChange={(mode) => {
                    if (mode === 'code') openCode();
                }}
                onRemove={onRemove}
                modeSwitchDisabled={elementEditing}
                actionsRef={setToolbarActions}
                panelRef={setPanelContainer}
            />
            <div className={b('body')}>
                <YfmHtmlBlockPreview
                    html={resultHtml}
                    onDoubleClick={openCodeOnDoubleClick ? openCode : undefined}
                    config={config}
                    frameRef={frameRef}
                />
                <FrameInlineEditing
                    frameRef={frameRef}
                    blockRef={blockRef}
                    sourceHtml={sourceHtml}
                    toolbarActions={toolbarActions}
                    panelContainer={panelContainer}
                    onEditingChange={setElementEditing}
                    onCommit={(nextHtml) =>
                        onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: nextHtml})
                    }
                />
            </div>
        </div>
    );
};
