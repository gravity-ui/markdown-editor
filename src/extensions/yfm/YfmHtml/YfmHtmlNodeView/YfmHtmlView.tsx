import React, {useEffect, useRef, useState} from 'react';

import {Ellipsis as DotsIcon, Eye} from '@gravity-ui/icons';
import {Button, Icon, Label, Menu, Popup} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {useBooleanState} from '../../../../react-utils/hooks';
import {removeNode} from '../../../../utils/remove-node';
import {YfmHtmlConsts} from '../YfmHtmlSpecs/const';

export const cnYfmHtml = cn('YfmHtml');
export const cnHelper = cn('YfmHtmlHelper');

import './YfmHtml.scss';

const b = cnYfmHtml;

interface YfmHtmlViewProps {
    html: string;
    onСlick: () => void;
}

export function generateID() {
    return Math.random().toString(36).substr(2, 8);
}

const PADDING = 20;

const YfmHtmlPreview: React.FC<YfmHtmlViewProps> = ({html, onСlick}) => {
    const ref = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState('100%');

    const handleLoadIFrameHandler = () => {
        const contentWindow = ref.current?.contentWindow;

        if (contentWindow) {
            const height = contentWindow.document.documentElement.scrollHeight + PADDING + 'px';
            setHeight(height);

            contentWindow.document.addEventListener('dblclick', () => {
                onСlick();
            });
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
    const [text, setText] = useState(initialText || '');

    return (
        <div className={b({editing: true})}>
            <div className={b('Editor')}>
                <div>
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
                </div>

                <div className={b('Controls')}>
                    <div>
                        <Button onClick={onCancel} view={'flat'}>
                            <span className={cnHelper({'prosemirror-stop-event': true})}>
                                Cancel
                            </span>
                        </Button>
                        <Button onClick={() => onSave(text)} view={'action'}>
                            <span className={cnHelper({'prosemirror-stop-event': true})}>Save</span>
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
}> = ({onChange, node, getPos, view}) => {
    const [editing, setEditing, unsetEditing, toggleEditing] = useBooleanState(false);
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
            <Label icon={<Icon size={16} data={Eye} />}>Preview</Label>
            <YfmHtmlPreview
                html={node.attrs[YfmHtmlConsts.NodeAttrs.srcdoc]}
                onСlick={handleClick}
            />
            <div>
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
                            Edit
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
                            Remove
                        </Menu.Item>
                    </Menu>
                </Popup>
            </div>
        </div>
    );
};
