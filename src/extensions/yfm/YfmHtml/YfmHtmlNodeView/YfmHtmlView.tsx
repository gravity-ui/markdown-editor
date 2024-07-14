import React, {useEffect, useRef, useState} from 'react';

import {Ellipsis as DotsIcon, Eye} from '@gravity-ui/icons';
import {Button, Icon, Label, Menu, Popup} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useBooleanState} from '../../../../react-utils/hooks';
import {removeNode} from '../../../../utils/remove-node';
import {YfmHtmlConsts} from '../YfmHtmlSpecs/const';

export const cnYfmHtml = cn('YfmHtml');
export const cnHelper = cn('YfmHtmlHelper');

import './YfmHtml.scss';

import {IHTMLIFrameElementConfig} from '../index';

const b = cnYfmHtml;

interface YfmHtmlViewProps {
    html: string;
    onСlick: () => void;
    config?: IHTMLIFrameElementConfig;
}

export function generateID() {
    return Math.random().toString(36).substr(2, 8);
}

const DEFAULT_PADDING = 20;

const YfmHtmlPreview: React.FC<YfmHtmlViewProps> = ({html, onСlick, config}) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const styles = useRef<Record<string, string>>({});
    const classNames = useRef<string[]>([]);

    useEffect(() => {
        setStyles(config?.styles);
        setClassNames(config?.classNames);
    }, [config, ref.current?.contentWindow?.document?.body]);

    const [height, setHeight] = useState('100%');

    const handleLoadIFrameHandler = () => {
        const contentWindow = ref.current?.contentWindow;

        if (contentWindow) {
            const frameDocument = contentWindow.document;
            const height =
                frameDocument.documentElement.scrollHeight +
                (config?.resizePadding || DEFAULT_PADDING) +
                'px';
            setHeight(height);

            frameDocument.addEventListener('dblclick', () => {
                onСlick();
            });
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
        ref.current?.addEventListener('load', handleLoadIFrameHandler);
        return () => {
            ref.current?.removeEventListener('load', handleLoadIFrameHandler);
        };
    }, [html]);

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
}> = ({initialText, onSave, onCancel}) => {
    const [text, setText] = useState(initialText || '\n');

    return (
        <div className={b({editing: true})}>
            <div className={b('Editor')}>
                <TextArea
                    className={b('CodeEditor')}
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

export const YfmHtmlView: React.FC<{
    view: EditorView;
    onChange: (attrs: {[YfmHtmlConsts.NodeAttrs.srcdoc]: string}) => void;
    node: Node;
    getPos: () => number | undefined;
    onCreate?: () => IHTMLIFrameElementConfig;
}> = ({onChange, node, getPos, view, onCreate}) => {
    const [editing, setEditing, unsetEditing, toggleEditing] = useBooleanState(
        Boolean(node.attrs[YfmHtmlConsts.NodeAttrs.newCreated]),
    );

    const config = onCreate?.();

    const [menuOpen, , , toggleMenuOpen] = useBooleanState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleClick = () => {
        setEditing();
    };

    if (editing) {
        return (
            <CodeEditMode
                initialText={node.attrs[YfmHtmlConsts.NodeAttrs.srcdoc]}
                onCancel={unsetEditing}
                onSave={(v) => {
                    onChange({[YfmHtmlConsts.NodeAttrs.srcdoc]: v});
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
            <YfmHtmlPreview
                html={node.attrs[YfmHtmlConsts.NodeAttrs.srcdoc]}
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
