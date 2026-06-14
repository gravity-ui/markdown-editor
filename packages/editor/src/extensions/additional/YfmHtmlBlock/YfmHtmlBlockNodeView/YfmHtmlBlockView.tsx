import {useEffect, useMemo, useRef, useState} from 'react';

import {getStyles} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {Ellipsis as DotsIcon, Eye, LayoutHeaderColumns} from '@gravity-ui/icons';
import {Button, Icon, Label, Menu, Popup} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {SharedStateKey} from 'src/extensions/behavior/SharedState';
import {TextAreaFixed as TextArea} from 'src/forms/TextInput';
import {i18n} from 'src/i18n/common';
import {i18n as i18nTemplates} from 'src/i18n/yfm-html-block';
import {debounce} from 'src/lodash';
import {useAutoSave, useBooleanState, useElementState} from 'src/react-utils/hooks';
import {useSharedEditingState} from 'src/react-utils/useSharedEditingState';
import {removeNode} from 'src/utils/remove-node';

import {YfmHtmlBlockConsts} from '../YfmHtmlBlockSpecs/const';
import type {YfmHtmlBlockOptions} from '../index';
import {type HtmlTemplate, mergeTemplatesById, readStoredTemplates} from '../templates';
import type {YfmHtmlBlockEntitySharedState} from '../types';

import {TemplatesPopup} from './TemplatesPopup';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock} from './const';

import './YfmHtmlBlock.scss';

export {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock} from './const';

const b = cnYfmHtmlBlock;

interface YfmHtmlBlockViewProps {
    html: string;
    onClick: () => void;
    config?: IHTMLIFrameElementConfig;
    editablePreview?: boolean;
    onInlineSave?: (innerHtml: string) => void;
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
    onClick,
    config,
    editablePreview,
    onInlineSave,
}) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const styles = useRef<Record<string, string>>({});
    const classNames = useRef<string[]>([]);
    const resizeConfig = useRef<Record<string, number>>({});
    const isInlineEditing = useRef(false);

    const [height, setHeight] = useState('100%');

    useEffect(() => {
        setStyles(config?.styles);
        setClassNames(config?.classNames);
    }, [config, ref.current?.contentWindow?.document?.body]);

    const enterInlineEdit = () => {
        const body = ref.current?.contentWindow?.document.body;
        if (!body) return;
        isInlineEditing.current = true;
        body.contentEditable = 'true';
        body.style.cursor = 'text';
        body.focus();
    };

    const handleBodyBlur = () => {
        const body = ref.current?.contentWindow?.document.body;
        if (!body || !isInlineEditing.current) return;
        isInlineEditing.current = false;
        body.contentEditable = 'false';
        body.style.removeProperty('cursor');
        onInlineSave?.(body.innerHTML);
    };

    const handleDblClick = () => {
        if (editablePreview) {
            enterInlineEdit();
        } else {
            onClick();
        }
    };

    const handleLoadIFrame = () => {
        const contentWindow = ref.current?.contentWindow;

        // fresh document after reload: not editing yet
        isInlineEditing.current = false;
        handleResizeIFrame();

        if (contentWindow) {
            const frameDocument = contentWindow.document;
            frameDocument.addEventListener('dblclick', handleDblClick);
            // blur does not bubble; capture catches focus leaving the body
            frameDocument.body?.addEventListener('blur', handleBodyBlur, true);
        }
    };

    const handleUnloadIFrame = () => {
        const frameDocument = ref.current?.contentWindow?.document;
        frameDocument?.removeEventListener('dblclick', handleDblClick);
        frameDocument?.body?.removeEventListener('blur', handleBodyBlur, true);
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
        const iframe = ref.current;
        iframe?.addEventListener('load', handleLoadIFrame);
        iframe?.addEventListener('load', createAnchorLinkHandlers('add'));
        return () => {
            handleUnloadIFrame();
            iframe?.removeEventListener('load', handleLoadIFrame);
            iframe?.removeEventListener('load', createAnchorLinkHandlers('remove'));
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
    options: YfmHtmlBlockOptions;
}> = ({initialText, onSave, onCancel, options: {autoSave}}) => {
    const {value, handleChange, handleManualSave, isSaveDisabled, isAutoSaveEnabled} = useAutoSave({
        initialValue: initialText || '\n',
        onSave,
        onClose: onCancel,
        autoSave,
    });

    return (
        <div className={b({editing: true})}>
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
                        {!isAutoSaveEnabled && (
                            <Button
                                onClick={handleManualSave}
                                view={'action'}
                                disabled={isSaveDisabled}
                            >
                                <span className={STOP_EVENT_CLASSNAME}>{i18n('save')}</span>
                            </Button>
                        )}
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
    const {
        useConfig,
        sanitize,
        styles,
        baseTarget = '_parent',
        head: headContent = '',
        templates,
        editablePreview,
    } = options;
    const entityId: string = node.attrs[YfmHtmlBlockConsts.NodeAttrs.EntityId];
    const entityKey = useMemo(
        () => SharedStateKey.define<YfmHtmlBlockEntitySharedState>({name: entityId}),
        [entityId],
    );

    const config = useConfig?.();

    const [editing, setEditing, unsetEditing] = useSharedEditingState(view, entityKey);
    const [menuOpen, _openMenu, closeMenu, toggleMenuOpen] = useBooleanState(false);
    const [anchorElement, setAnchorElement] = useElementState();

    const allowAdd = Boolean(templates?.allowAdd);
    const [storedTemplates, setStoredTemplates] = useState<HtmlTemplate[]>(readStoredTemplates);
    const effectiveTemplates = useMemo(
        () => mergeTemplatesById(templates?.items ?? [], storedTemplates),
        [templates?.items, storedTemplates],
    );
    const showTemplatesButton =
        Boolean(templates?.showButton) && (allowAdd || effectiveTemplates.length > 0);
    const [templatesOpen, , closeTemplates, toggleTemplatesOpen] = useBooleanState(false);
    const [templatesAnchor, setTemplatesAnchor] = useElementState();

    const applyTemplate = (template: HtmlTemplate) => {
        onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: template.content});
        closeTemplates();
    };

    const handleInlineSave = (innerHtml: string) => {
        const current = node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc] ?? '';
        if (innerHtml === current) return;
        onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: innerHtml});
    };

    if (editing) {
        return (
            <CodeEditMode
                initialText={node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc]}
                onCancel={unsetEditing}
                onSave={(v) => {
                    onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: v});
                }}
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
    const body = `<body>${node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc] ?? ''}</body>`;
    const html = `<!DOCTYPE html><html>${head}${body}</html>`;

    const sanitizeFunction = typeof sanitize === 'function' ? sanitize : sanitize?.body;

    const resultHtml = sanitizeFunction ? sanitizeFunction(html) : html;

    return (
        <div className={b()} onDoubleClick={setEditing}>
            <Label className={b('label')} icon={<Icon size={16} data={Eye} />}>
                {i18n('preview')}
            </Label>
            <YfmHtmlBlockPreview
                html={resultHtml}
                onClick={setEditing}
                config={config}
                editablePreview={editablePreview}
                onInlineSave={handleInlineSave}
            />

            <div className={b('menu')}>
                {showTemplatesButton && (
                    <>
                        <Button
                            onClick={toggleTemplatesOpen}
                            ref={setTemplatesAnchor}
                            size="s"
                            className={STOP_EVENT_CLASSNAME}
                            aria-label={i18nTemplates('templates')}
                        >
                            <Icon data={LayoutHeaderColumns} className={STOP_EVENT_CLASSNAME} />
                        </Button>
                        <TemplatesPopup
                            anchor={templatesAnchor}
                            open={templatesOpen}
                            templates={effectiveTemplates}
                            allowAdd={allowAdd}
                            onClose={closeTemplates}
                            onApply={applyTemplate}
                            onAdded={setStoredTemplates}
                        />
                    </>
                )}
                <Button
                    onClick={toggleMenuOpen}
                    ref={setAnchorElement}
                    size="s"
                    className={STOP_EVENT_CLASSNAME}
                    aria-label={i18n('actions')}
                >
                    <Icon data={DotsIcon} className={STOP_EVENT_CLASSNAME} />
                </Button>
                <Popup
                    anchorElement={anchorElement}
                    open={menuOpen}
                    onOpenChange={closeMenu}
                    placement="bottom-end"
                >
                    <Menu>
                        <Menu.Item
                            onClick={() => {
                                setEditing();
                                closeMenu();
                            }}
                        >
                            {i18n('edit')}
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => {
                                const pos = getPos();
                                if (pos === undefined) return;
                                removeNode({
                                    node,
                                    pos,
                                    tr: view.state.tr,
                                    dispatch: view.dispatch,
                                });
                            }}
                        >
                            {i18n('remove')}
                        </Menu.Item>
                    </Menu>
                </Popup>
            </div>
        </div>
    );
};
