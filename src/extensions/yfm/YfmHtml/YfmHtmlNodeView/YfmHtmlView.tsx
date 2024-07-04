import React, {useRef, useState} from 'react';

import {Ellipsis as DotsIcon} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {useBooleanState} from '../../../../react-utils/hooks';
import {removeNode} from '../../../../utils/remove-node';
import {YfmHtmlConsts} from '../YfmHtmlSpecs/const';

export const cnYfmHtml = cn('YfmHtml');
export const cnDiagramHelper = cn('YfmHtmlHelper');

import './YfmHtml.scss';

const b = cnYfmHtml;

interface YfmHtmlViewProps {
    html: string;
}

export function generateID() {
    return Math.random().toString(36).substr(2, 8);
}

const YfmHtmlPreview: React.FC<YfmHtmlViewProps> = ({html}) => {
    return <iframe title={generateID()} srcDoc={html} />;
};

const DiagramEditMode: React.FC<{
    initialText: string;
    onSave: (v: string) => void;
    onCancel: () => void;
}> = ({initialText, onSave, onCancel}) => {
    const [text, setText] = useState(initialText || '');

    return (
        <div className={b()}>
            <YfmHtmlPreview html={initialText} />
            <div className={b('Editor')}>
                <div>
                    <TextArea
                        controlProps={{
                            className: cnDiagramHelper({'prosemirror-stop-event': true}),
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
                            <span className={cnDiagramHelper({'prosemirror-stop-event': true})}>
                                Cancel
                            </span>
                        </Button>
                        <Button onClick={() => onSave(text)} view={'action'}>
                            <span className={cnDiagramHelper({'prosemirror-stop-event': true})}>
                                Save
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
}> = ({onChange, node, getPos, view}) => {
    const [editing, setEditing, unsetEditing, toggleEditing] = useBooleanState(false);
    const [menuOpen, , , toggleMenuOpen] = useBooleanState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    if (editing) {
        return (
            <DiagramEditMode
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
            <YfmHtmlPreview html={node.attrs[YfmHtmlConsts.NodeAttrs.srcdoc]} />
            <div>
                <Button
                    onClick={toggleMenuOpen}
                    ref={buttonRef}
                    size={'s'}
                    className={cnDiagramHelper({'prosemirror-stop-event': true})}
                >
                    <Icon
                        data={DotsIcon}
                        className={cnDiagramHelper({'prosemirror-stop-event': true})}
                    />
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
