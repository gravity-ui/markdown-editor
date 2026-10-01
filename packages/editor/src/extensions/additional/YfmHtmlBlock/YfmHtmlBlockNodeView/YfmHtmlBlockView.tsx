import {useEffect, useMemo, useRef, useState} from 'react';
import type {RefObject} from 'react';

import {getStyles} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {Code, Eye, Pencil, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Label} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {SharedStateKey} from 'src/extensions/behavior/SharedState';
import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/common';
import {debounce} from 'src/lodash';
import {useAutoSave} from 'src/react-utils/hooks';
import {useSharedEditingState} from 'src/react-utils/useSharedEditingState';
import {removeNode} from 'src/utils/remove-node';

import {YfmHtmlBlockConsts} from '../YfmHtmlBlockSpecs/const';
import type {YfmHtmlBlockOptions} from '../index';
import type {YfmHtmlBlockEntitySharedState} from '../types';

import {FrameInlineEditing} from './FrameInlineEditing';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock} from './const';

import './YfmHtmlBlock.scss';

const b = cnYfmHtmlBlock;

type ViewMode = 'preview' | 'editor' | 'code';

const ModeSwitcher: React.FC<{
    mode: ViewMode;
    onPreviewToggle: () => void;
    onCode?: () => void;
    onRemove: () => void;
}> = ({mode, onPreviewToggle, onCode, onRemove}) => {
    return (
        <div className={`${b('toolbar')} ${STOP_EVENT_CLASSNAME}`}>
            <div className={b('modes')} role="group" aria-label={i18n('view_mode')}>
                <Button
                    view={mode === 'preview' ? 'normal' : 'flat'}
                    size="m"
                    selected={mode === 'preview'}
                    aria-pressed={mode === 'preview'}
                    aria-label={i18n('preview')}
                    title={i18n('preview')}
                    className={STOP_EVENT_CLASSNAME}
                    onClick={onPreviewToggle}
                >
                    <Icon data={Eye} size={16} />
                </Button>
                <Button
                    view={mode === 'code' ? 'normal' : 'flat'}
                    size="m"
                    selected={mode === 'code'}
                    aria-pressed={mode === 'code'}
                    aria-label={i18n('code')}
                    title={i18n('code')}
                    className={STOP_EVENT_CLASSNAME}
                    onClick={onCode}
                >
                    <Icon data={Code} size={16} />
                </Button>
            </div>
            <span className={b('toolbar-separator')} aria-hidden="true" />
            <Button
                view="flat-danger"
                size="m"
                className={STOP_EVENT_CLASSNAME}
                aria-label={i18n('remove')}
                title={i18n('remove')}
                onClick={onRemove}
            >
                <Icon data={TrashBin} size={16} />
            </Button>
        </div>
    );
};

interface YfmHtmlBlockViewProps {
    html: string;
    onDoubleClick: () => void;
    config?: IHTMLIFrameElementConfig;
    frameRef: RefObject<HTMLIFrameElement>;
}

export function generateID() {
    return Math.random().toString(36).substr(2, 8);
}

const DEFAULT_PADDING = 20;
const DEFAULT_DELAY = 100;

const createLinkCLickHandler = (value: Element, document: Document) => (event: Event) => {
    event.preventDefault();
    const targetId = value.getAttribute('href');

    if (targetId) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({behavior: 'smooth'});
        }
    }
};

const YfmHtmlBlockPreview: React.FC<YfmHtmlBlockViewProps> = ({
    html,
    onDoubleClick,
    config,
    frameRef: ref,
}) => {
    const styles = useRef<Record<string, string>>({});
    const classNames = useRef<string[]>([]);
    const resizeConfig = useRef<Record<string, number>>({});

    const [height, setHeight] = useState('100%');

    useEffect(() => {
        setStyles(config?.styles);
        setClassNames(config?.classNames);
    }, [config, ref.current?.contentWindow?.document?.body]);

    const handleLoadIFrame = () => {
        const contentWindow = ref.current?.contentWindow;

        handleResizeIFrame();

        if (contentWindow) {
            const frameDocument = contentWindow.document;
            frameDocument.addEventListener('dblclick', () => {
                onDoubleClick();
            });
        }
    };

    const handleResizeIFrame = () => {
        if (ref.current) {
            const contentWindow = ref.current?.contentWindow;
            if (contentWindow) {
                const body = contentWindow.document.body;
                if (body) {
                    const height =
                        body.scrollHeight +
                        (resizeConfig.current?.padding || DEFAULT_PADDING) +
                        'px';

                    setHeight(height);
                }
            }
        }
    };

    const setClassNames = (newClassNames: string[] | undefined) => {
        const body = ref.current?.contentWindow?.document.body;

        if (body && newClassNames) {
            const previousClassNames = classNames.current;

            // remove all classes that were in previousClassNames but are not in classNames
            previousClassNames.forEach((className) => {
                if (!newClassNames.includes(className)) {
                    body.classList.remove(className);
                }
            });

            // add classes that are in classNames
            newClassNames.forEach((className) => {
                if (!body.classList.contains(className)) {
                    body.classList.add(className);
                }
            });

            classNames.current = newClassNames;
        }
    };

    const setStyles = (newStyles: Record<string, string> | undefined) => {
        const body = ref.current?.contentWindow?.document.body;

        if (body && newStyles) {
            const previousStyles = styles.current;

            // remove all styles that are in previousStyles but not in styles
            Object.keys(previousStyles).forEach((property) => {
                if (!Object.prototype.hasOwnProperty.call(newStyles, property)) {
                    body.style.removeProperty(property);
                }
            });

            // sdd or update styles that are in styles
            Object.keys(newStyles).forEach((property) => {
                body.style.setProperty(property, newStyles[property]);
            });

            // update current styles to the new styles
            styles.current = newStyles;
        }
    };

    // finds all relative links (href^="#") and changes their click behavior
    const createAnchorLinkHandlers = (type: 'add' | 'remove') => () => {
        const document = ref.current?.contentWindow!.document;

        if (document) {
            document.querySelectorAll('a[href^="#"]').forEach((value: Element) => {
                const handler = createLinkCLickHandler(value, document);
                if (type === 'add') {
                    value.addEventListener('click', handler);
                } else {
                    value.removeEventListener('click', handler);
                }
            });
        }
    };

    useEffect(() => {
        ref.current?.addEventListener('load', handleLoadIFrame);
        ref.current?.addEventListener('load', createAnchorLinkHandlers('add'));
        return () => {
            ref.current?.removeEventListener('load', handleLoadIFrame);
            ref.current?.removeEventListener('load', createAnchorLinkHandlers('remove'));
        };
    }, [html]);

    useEffect(() => {
        if (ref.current) {
            const resizeObserver = new window.ResizeObserver(
                debounce(handleResizeIFrame, DEFAULT_DELAY),
            );
            resizeObserver.observe(ref.current);
        }
    }, [ref.current?.contentWindow?.document?.body]);

    return (
        <iframe
            style={{
                height,
            }}
            ref={ref}
            title={generateID()}
            frameBorder={0}
            className={b('content')}
            srcDoc={html}
        />
    );
};

const CodeEditMode: React.FC<{
    initialText: string;
    onSave: (v: string) => void;
    onCancel: () => void;
    onPreview: () => void;
    onVisualEdit: () => void;
    onRemove: () => void;
    options: YfmHtmlBlockOptions;
}> = ({initialText, onSave, onCancel, onPreview, onVisualEdit, onRemove, options: {autoSave}}) => {
    const {value, handleChange, handleManualSave, hasUnsavedChanges, isAutoSaveEnabled} =
        useAutoSave({initialValue: initialText || '\n', onSave, onClose: onCancel, autoSave});

    const closeWithChanges = () => {
        if (hasUnsavedChanges) handleManualSave();
        else onCancel();
    };

    return (
        <div className={b({editing: true})}>
            <ModeSwitcher
                mode="code"
                onPreviewToggle={() => {
                    closeWithChanges();
                    onPreview();
                }}
                onRemove={onRemove}
            />
            <div className={b('editor')}>
                <TextArea
                    controlProps={{
                        className: STOP_EVENT_CLASSNAME,
                    }}
                    value={value}
                    onUpdate={handleChange}
                    autoFocus
                />

                <div className={b('controls')}>
                    <div>
                        <Button onClick={onCancel} view={'flat'}>
                            <span className={STOP_EVENT_CLASSNAME}>
                                {isAutoSaveEnabled ? i18n('close') : i18n('cancel')}
                            </span>
                        </Button>
                        <Button
                            onClick={() => {
                                closeWithChanges();
                                onVisualEdit();
                            }}
                            view={'action'}
                        >
                            <span className={STOP_EVENT_CLASSNAME}>{i18n('save')}</span>
                        </Button>
                    </div>
                </div>
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
    const {useConfig, sanitize, styles, baseTarget = '_parent', head: headContent = ''} = options;
    const entityId: string = node.attrs[YfmHtmlBlockConsts.NodeAttrs.EntityId];
    const entityKey = useMemo(
        () => SharedStateKey.define<YfmHtmlBlockEntitySharedState>({name: entityId}),
        [entityId],
    );

    const config = useConfig?.();

    const [editing, setEditing, unsetEditing] = useSharedEditingState(view, entityKey);
    const [visualEditing, setVisualEditing] = useState(true);
    const blockRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLIFrameElement>(null);
    const sourceHtml: string = node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc] ?? '';

    const openCode = () => setEditing();

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
                onPreview={() => setVisualEditing(false)}
                onVisualEdit={() => setVisualEditing(true)}
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
            onDoubleClick={(event) => {
                if ((event.target as HTMLElement).closest(`.${STOP_EVENT_CLASSNAME}`)) return;
                openCode();
            }}
        >
            <Label
                className={b('label')}
                icon={<Icon size={16} data={visualEditing ? Pencil : Eye} />}
            >
                {i18n(visualEditing ? 'editor' : 'preview')}
            </Label>
            <YfmHtmlBlockPreview
                html={resultHtml}
                onDoubleClick={openCode}
                config={config}
                frameRef={frameRef}
            />

            {visualEditing && (
                <FrameInlineEditing
                    frameRef={frameRef}
                    blockRef={blockRef}
                    sourceHtml={sourceHtml}
                    onCommit={(html) => onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: html})}
                />
            )}

            <ModeSwitcher
                mode={visualEditing ? 'editor' : 'preview'}
                onPreviewToggle={() => setVisualEditing((wasVisualEditing) => !wasVisualEditing)}
                onCode={openCode}
                onRemove={onRemove}
            />
        </div>
    );
};
