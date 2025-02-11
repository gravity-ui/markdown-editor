import {useEffect, useRef, useState} from 'react';

import {getStyles} from '@diplodoc/html-extension';
import type {IHTMLIFrameElementConfig} from '@diplodoc/html-extension/runtime';
import {Ellipsis as DotsIcon, Eye} from '@gravity-ui/icons';
import {Button, Icon, Label, Menu, Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useBooleanState, useElementState} from '../../../../react-utils/hooks';
import {removeNode} from '../../../../utils/remove-node';
import {YfmHtmlBlockConsts} from '../YfmHtmlBlockSpecs/const';
import {YfmHtmlBlockOptions} from '../index';

import './YfmHtmlBlock.scss';

export const cnYfmHtmlBlock = cn('yfm-html-block');
export const STOP_EVENT_CLASSNAME = 'prosemirror-stop-event';

const b = cnYfmHtmlBlock;

interface YfmHtmlBlockViewProps {
    html: string;
    onСlick: () => void;
    config?: IHTMLIFrameElementConfig;
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

const YfmHtmlBlockPreview: React.FC<YfmHtmlBlockViewProps> = ({html, onСlick, config}) => {
    const ref = useRef<HTMLIFrameElement>(null);
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
                onСlick();
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
}> = ({initialText, onSave, onCancel}) => {
    const [text, setText] = useState(initialText || '\n');

    return (
        <div className={b({editing: true})}>
            <div className={b('editor')}>
                <TextArea
                    controlProps={{
                        className: STOP_EVENT_CLASSNAME,
                    }}
                    value={text}
                    onUpdate={(v) => {
                        setText(v);
                    }}
                    autoFocus
                />

                <div className={b('controls')}>
                    <div>
                        <Button onClick={onCancel} view={'flat'}>
                            <span className={STOP_EVENT_CLASSNAME}>{i18n('cancel')}</span>
                        </Button>
                        <Button onClick={() => onSave(text)} view={'action'}>
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
}> = ({
    onChange,
    node,
    getPos,
    view,
    options: {useConfig, sanitize, styles, baseTarget = '_parent', head: headContent = ''},
}) => {
    const [editing, setEditing, unsetEditing, toggleEditing] = useBooleanState(
        Boolean(node.attrs[YfmHtmlBlockConsts.NodeAttrs.newCreated]),
    );

    const config = useConfig?.();

    const [menuOpen, _openMenu, closeMenu, toggleMenuOpen] = useBooleanState(false);
    const [anchorElement, setAnchorElement] = useElementState();

    const handleClick = () => {
        setEditing();
    };

    if (editing) {
        return (
            <CodeEditMode
                initialText={node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc]}
                onCancel={unsetEditing}
                onSave={(v) => {
                    onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: v});
                    unsetEditing();
                }}
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

    const resultHtml = sanitize ? sanitize(html) : html;

    return (
        <div className={b()} onDoubleClick={setEditing}>
            <Label className={b('label')} icon={<Icon size={16} data={Eye} />}>
                {i18n('preview')}
            </Label>
            <YfmHtmlBlockPreview html={resultHtml} onСlick={handleClick} config={config} />

            <div className={b('menu')}>
                <Button
                    onClick={toggleMenuOpen}
                    ref={setAnchorElement}
                    size="s"
                    className={STOP_EVENT_CLASSNAME}
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
                                toggleEditing();
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
