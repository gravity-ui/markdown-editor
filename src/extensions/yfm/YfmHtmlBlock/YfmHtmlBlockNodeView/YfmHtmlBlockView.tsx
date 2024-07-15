import React, {useEffect, useRef, useState} from 'react';

import {Ellipsis as DotsIcon, Eye} from '@gravity-ui/icons';
import {Button, Icon, Label, Menu, Popup} from '@gravity-ui/uikit';
import debounce from 'lodash/debounce';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useBooleanState} from '../../../../react-utils/hooks';
import {removeNode} from '../../../../utils/remove-node';
import {YfmHtmlBlockConsts} from '../YfmHtmlBlockSpecs/const';
import {IHTMLIFrameElementConfig} from '../index';

export const cnYfmHtmlBlock = cn('YfmHtmlBlock');
export const cnHelper = cn('YfmHtmlBlockHelper');

import './YfmHtmlBlock.scss';

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

const YfmHtmlBlockPreview: React.FC<YfmHtmlBlockViewProps> = ({html, onСlick, config}) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const styles = useRef<Record<string, string>>({});
    const classNames = useRef<string[]>([]);
    const resizeConfig = useRef<Record<string, number>>({});

    const [height, setHeight] = useState('100%');

    useEffect(() => {
        resizeConfig.current = {
            padding: config?.resizePadding ?? DEFAULT_PADDING,
            delay: config?.resizeDelay ?? DEFAULT_DELAY,
        };
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

    useEffect(() => {
        ref.current?.addEventListener('load', handleLoadIFrame);
        return () => {
            ref.current?.removeEventListener('load', handleLoadIFrame);
        };
    }, [html]);

    useEffect(() => {
        if (ref.current) {
            const resizeObserver = new window.ResizeObserver(
                debounce(handleResizeIFrame, resizeConfig.current?.delay ?? DEFAULT_DELAY),
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
            className={b('Content')}
            srcDoc={html}
        />
    );
};

const CodeEditMode: React.FC<{
    initialText: string;
    onSave: (v: string) => void;
    onCancel: () => void;
    config?: IHTMLIFrameElementConfig;
}> = ({initialText, onSave, onCancel, config}) => {
    const [text, setText] = useState(initialText || '\n');

    return (
        <div className={b({editing: true})}>
            <div className={b('Editor')}>
                <TextArea
                    style={config?.styles}
                    className={b('CodeEditor', config?.classNames?.join())}
                    controlProps={{
                        className: cnHelper({'prosemirror-stop-event': true}),
                    }}
                    value={text}
                    onUpdate={(v) => {
                        setText(v);
                    }}
                    autoFocus
                />

                <div className={b('Controls')}>
                    <div>
                        <Button onClick={onCancel} view={'flat'}>
                            <span className={cnHelper({'prosemirror-stop-event': true})}>
                                {i18n('cancel')}
                            </span>
                        </Button>
                        <Button onClick={() => onSave(text)} view={'action'}>
                            <span className={cnHelper({'prosemirror-stop-event': true})}>
                                {i18n('save')}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const YfmHtmlBlockView: React.FC<{
    view: EditorView;
    onChange: (attrs: {[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: string}) => void;
    node: Node;
    getPos: () => number | undefined;
    useConfig?: () => IHTMLIFrameElementConfig | undefined;
}> = ({onChange, node, getPos, view, useConfig}) => {
    const [editing, setEditing, unsetEditing, toggleEditing] = useBooleanState(
        Boolean(node.attrs[YfmHtmlBlockConsts.NodeAttrs.newCreated]),
    );

    const config = useConfig?.();

    const [menuOpen, , , toggleMenuOpen] = useBooleanState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleClick = () => {
        setEditing();
    };

    if (editing) {
        return (
            <CodeEditMode
                config={config}
                initialText={node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc]}
                onCancel={unsetEditing}
                onSave={(v) => {
                    onChange({[YfmHtmlBlockConsts.NodeAttrs.srcdoc]: v});
                    unsetEditing();
                }}
            />
        );
    }

    return (
        <div className={b()} onDoubleClick={setEditing}>
            <Label className={b('Label')} icon={<Icon size={16} data={Eye} />}>
                {i18n('preview')}
            </Label>
            <YfmHtmlBlockPreview
                html={node.attrs[YfmHtmlBlockConsts.NodeAttrs.srcdoc]}
                onСlick={handleClick}
                config={config}
            />

            <div className={b('Menu')}>
                <Button
                    onClick={toggleMenuOpen}
                    ref={buttonRef}
                    size={'s'}
                    className={cnHelper({'prosemirror-stop-event': true})}
                >
                    <Icon data={DotsIcon} className={cnHelper({'prosemirror-stop-event': true})} />
                </Button>
                <Popup
                    anchorRef={buttonRef}
                    open={menuOpen}
                    onClose={toggleMenuOpen}
                    placement={['bottom-end']}
                >
                    <Menu>
                        <Menu.Item
                            onClick={() => {
                                toggleEditing();
                                toggleMenuOpen();
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
