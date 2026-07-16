import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';

import {getStyles} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {Button} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {SharedStateKey} from 'src/extensions/behavior/SharedState';
import {i18n} from 'src/i18n/common';
import {i18n as i18nTemplates} from 'src/i18n/yfm-html-block';
import {debounce} from 'src/lodash';
import {useAutoSave} from 'src/react-utils/hooks';

import {
    YfmHtmlConstructorConsts,
    buildYfmHtmlConstructorHtml,
    emptyHtmlConstructorStructure,
} from '../../YfmHtmlConstructor/YfmHtmlConstructorSpecs';
import {
    YfmHtmlConstructorEditor,
    type YfmHtmlConstructorEditorState,
} from '../../YfmHtmlConstructor/YfmHtmlConstructorNodeView/YfmHtmlConstructorView';
import {CodeEditorPane} from '../../YfmHtmlConstructor/YfmHtmlConstructorNodeView/SettingsPopups';
import {normalizeHtmlConstructorQuickStyle} from '../../YfmHtmlConstructor/quickStyle';
import {normalizeHtmlConstructorTemplateSettings} from '../../YfmHtmlConstructor/settings';
import type {HtmlConstructorBlock, HtmlConstructorStructure} from '../../YfmHtmlConstructor/types';
import {YfmHtmlBlockConsts} from '../YfmHtmlBlockSpecs/const';
import type {YfmHtmlBlockOptions} from '../index';
import type {YfmHtmlBlockEntitySharedState, YfmHtmlBlockTab} from '../types';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock} from './const';

import './YfmHtmlBlock.scss';

export {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock} from './const';

const b = cnYfmHtmlBlock;

interface YfmHtmlBlockViewProps {
    html: string;
    config?: IHTMLIFrameElementConfig;
    editablePreview?: boolean;
    onInlineSave?: (innerHtml: string) => void;
}

export function generateID() {
    return Math.random().toString(36).substr(2, 8);
}

const DEFAULT_PADDING = 20;
const DEFAULT_DELAY = 100;
const HTML_BLOCK_TABS: YfmHtmlBlockTab[] = ['preview', 'html', 'constructor'];
const HTML_BLOCK_TAB_LABELS: Record<YfmHtmlBlockTab, Parameters<typeof i18nTemplates>[0]> = {
    preview: 'tab_preview',
    constructor: 'tab_constructor',
    html: 'tab_html',
};
const EMPTY_CONSTRUCTOR_BLOCKS: HtmlConstructorBlock[] = [];

const readSharedTab = (state?: YfmHtmlBlockEntitySharedState): YfmHtmlBlockTab => {
    if (state?.activeTab && HTML_BLOCK_TABS.includes(state.activeTab)) return state.activeTab;
    if (state?.editing) return 'html';

    return 'preview';
};

const readConstructorStructure = (node: Node, fallbackContent: string): HtmlConstructorStructure => {
    const value = node.attrs[YfmHtmlBlockConsts.NodeAttrs.constructorStructure];
    if (!value || typeof value !== 'object') {
        return {...emptyHtmlConstructorStructure(), content: fallbackContent};
    }

    return {
        templateId: typeof value.templateId === 'string' ? value.templateId : undefined,
        css: typeof value.css === 'string' ? value.css : '',
        content: typeof value.content === 'string' ? value.content : fallbackContent,
        themeIds: Array.isArray(value.themeIds)
            ? value.themeIds.filter((id: unknown): id is string => typeof id === 'string')
            : [],
        settings: normalizeHtmlConstructorTemplateSettings(value.settings),
        quickStyle: normalizeHtmlConstructorQuickStyle(value.quickStyle),
    };
};

const readConstructorBlocks = (node: Node): HtmlConstructorBlock[] => {
    const value = node.attrs[YfmHtmlBlockConsts.NodeAttrs.constructorBlocks];
    if (!Array.isArray(value)) return EMPTY_CONSTRUCTOR_BLOCKS;

    return value.flatMap((block): HtmlConstructorBlock[] => {
        if (!block || typeof block !== 'object') return [];

        return [
            {
                id: typeof block.id === 'string' ? block.id : '',
                templateId: typeof block.templateId === 'string' ? block.templateId : undefined,
                css: typeof block.css === 'string' ? block.css : '',
                content: typeof block.content === 'string' ? block.content : '',
                themeIds: Array.isArray(block.themeIds)
                    ? block.themeIds.filter((id: unknown): id is string => typeof id === 'string')
                    : [],
                settings: normalizeHtmlConstructorTemplateSettings(block.settings),
                quickStyle: normalizeHtmlConstructorQuickStyle(block.quickStyle),
            },
        ];
    });
};

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
        if (editablePreview) enterInlineEdit();
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
                <CodeEditorPane
                    label={i18nTemplates('tab_html')}
                    value={value}
                    placeholder={'<div>\n  HTML\n</div>'}
                    showLabel={false}
                    autoFocus
                    onUpdate={handleChange}
                    onCommit={() => {
                        if (isAutoSaveEnabled) return;
                        onSave(value);
                    }}
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
    onChange: (attrs: Partial<Node['attrs']>) => void;
    options: YfmHtmlBlockOptions;
    view: EditorView;
}> = ({onChange, node, view, options}) => {
    const {
        useConfig,
        sanitize,
        styles,
        baseTarget = '_parent',
        head: headContent = '',
        editablePreview,
    } = options;
    const rawConstructorOptions = Object.prototype.hasOwnProperty.call(options, 'constructor')
        ? options.constructor
        : undefined;
    const constructorOptions =
        rawConstructorOptions && typeof rawConstructorOptions === 'object'
            ? rawConstructorOptions
            : {};
    const entityId: string = node.attrs[YfmHtmlBlockConsts.NodeAttrs.EntityId];
    const entityKey = useMemo(
        () => SharedStateKey.define<YfmHtmlBlockEntitySharedState>({name: entityId}),
        [entityId],
    );
    const srcdoc = node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc] ?? '';

    const config = useConfig?.();

    const [activeTab, setActiveTabValue] = useState<YfmHtmlBlockTab>('preview');

    useLayoutEffect(() => {
        setActiveTabValue(readSharedTab(entityKey.getValue(view.state)));
        return entityKey
            .getNotifier(view.state)
            .subscribe((state) => setActiveTabValue(readSharedTab(state)));
    }, [entityKey, view]);

    const setActiveTab = (tab: YfmHtmlBlockTab) => {
        setActiveTabValue(tab);
        view.dispatch(
            entityKey.appendTransaction.update(view.state.tr, {
                activeTab: tab,
                editing: tab === 'html',
            }),
        );
    };

    const [structurePanelSignal] = useState<{
        panel: 'templates';
        tick: number;
    }>();

    const resetConstructorAttrs = {
        [YfmHtmlBlockConsts.NodeAttrs.constructorStructure]: null,
        [YfmHtmlBlockConsts.NodeAttrs.constructorBlocks]: null,
    };

    const updatePlainHtml = (value: string) => {
        onChange({
            [YfmHtmlBlockConsts.NodeAttrs.srcdoc]: value,
            ...resetConstructorAttrs,
        });
    };

    const handleInlineSave = (innerHtml: string) => {
        if (innerHtml === srcdoc) return;
        updatePlainHtml(innerHtml);
    };

    const constructorState = useMemo<YfmHtmlConstructorEditorState>(
        () => ({
            structure: readConstructorStructure(node, srcdoc),
            blocks: readConstructorBlocks(node),
        }),
        [node, srcdoc],
    );

    const handleConstructorChange = (state: YfmHtmlConstructorEditorState) => {
        const constructorNode = {
            attrs: {
                [YfmHtmlConstructorConsts.NodeAttrs.structure]: state.structure,
                [YfmHtmlConstructorConsts.NodeAttrs.blocks]: state.blocks,
                [YfmHtmlConstructorConsts.NodeAttrs.EntityId]: entityId,
            },
        } as unknown as Node;
        const html = buildYfmHtmlConstructorHtml(constructorNode, {
            scopeStyles: constructorOptions.scopeStyles,
        });

        onChange({
            [YfmHtmlBlockConsts.NodeAttrs.srcdoc]: html,
            [YfmHtmlBlockConsts.NodeAttrs.constructorStructure]: state.structure,
            [YfmHtmlBlockConsts.NodeAttrs.constructorBlocks]: state.blocks,
        });
    };

    let additional = baseTarget ? `<base target="${baseTarget}">` : '';
    if (styles) {
        const stylesContent =
            typeof styles === 'string'
                ? `<link rel="stylesheet" href="${styles}" />`
                : `<style>${getStyles(styles)}</style>`;
        additional += stylesContent;
    }

    const head = `<head>${headContent || additional}</head>`;
    const body = `<body>${srcdoc}</body>`;
    const html = `<!DOCTYPE html><html>${head}${body}</html>`;

    const sanitizeFunction = typeof sanitize === 'function' ? sanitize : sanitize?.body;

    const resultHtml = sanitizeFunction ? sanitizeFunction(html) : html;

    const renderTabPanel = () => {
        if (activeTab === 'preview') {
            return (
                <YfmHtmlBlockPreview
                    html={resultHtml}
                    config={config}
                    editablePreview={editablePreview}
                    onInlineSave={handleInlineSave}
                />
            );
        }

        if (activeTab === 'constructor') {
            return (
                <YfmHtmlConstructorEditor
                    state={constructorState}
                    entityId={entityId}
                    options={constructorOptions}
                    onChange={handleConstructorChange}
                    openStructurePanelSignal={structurePanelSignal}
                />
            );
        }

        return (
            <CodeEditMode
                initialText={srcdoc}
                onCancel={() => setActiveTab('preview')}
                onSave={updatePlainHtml}
                options={options}
            />
        );
    };

    return (
        <div className={b()}>
            <div className={b('header')}>
                <div className={b('tabs', [STOP_EVENT_CLASSNAME])} role="tablist">
                    {HTML_BLOCK_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab}
                            className={b('tab', {active: activeTab === tab}, [
                                STOP_EVENT_CLASSNAME,
                            ])}
                            onClick={() => setActiveTab(tab)}
                        >
                            {i18nTemplates(HTML_BLOCK_TAB_LABELS[tab])}
                        </button>
                    ))}
                </div>
            </div>
            <div className={b('panel')} role="tabpanel">
                {renderTabPanel()}
            </div>
        </div>
    );
};
