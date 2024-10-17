import React, {useEffect, useRef, useState} from 'react';

import {Ellipsis as DotsIcon} from '@gravity-ui/icons';
import {Button, Icon, Loader, Menu, Popup} from '@gravity-ui/uikit';
import type {Mermaid} from 'mermaid';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useBooleanState} from '../../../../react-utils';
import {removeNode} from '../../../../utils';
import {MermaidConsts} from '../MermaidSpecs/const';
export const cnMermaid = cn('Mermaid');
export const cnDiagramHelper = cn('MermaidHelper');

import './Mermaid.scss';

const b = cnMermaid;

const MermaidPreview: React.FC<{mermaidInstance: Mermaid | null; text: string}> = ({
    mermaidInstance,
    text = '',
}) => {
    const [svg, setSvg] = useState<string>();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const p = async () => {
            if (mermaidInstance) {
                try {
                    // Validates syntax and throws error if text is invalid
                    await mermaidInstance.parse(text);

                    const {svg: S} = await mermaidInstance.render(`mermaid-${Date.now()}`, text);

                    setSvg(S);
                    setError(null);
                } catch (e) {
                    setError((e as Error).message);
                }
            }
        };

        p();
    }, [mermaidInstance, text]);

    if (error) {
        return <div className={b('Error')}>{error && <div>{error}</div>}</div>;
    }

    return (
        <div className={b('Preview')}>
            {svg ? <div className="mermaid" dangerouslySetInnerHTML={{__html: svg}} /> : <Loader />}
        </div>
    );
};

const DiagramEditMode: React.FC<{
    initialText: string;
    mermaidInstance: Mermaid | null;
    onSave: (v: string) => void;
    onCancel: () => void;
}> = ({initialText, onSave, onCancel, mermaidInstance}) => {
    const [text, setText] = useState(initialText || '');

    return (
        <div className={b()}>
            <MermaidPreview mermaidInstance={mermaidInstance} text={text} />
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

export const MermaidView: React.FC<{
    view: EditorView;
    onChange: (attrs: {[MermaidConsts.NodeAttrs.content]: string}) => void;
    getMermaidInstance: () => Mermaid;
    node: Node;
    getPos: () => number | undefined;
}> = ({onChange, node, getPos, view, getMermaidInstance}) => {
    const [mermaidInstance, setMermaidInstance] = useState<Mermaid | null>(null);
    const [editing, setEditing, unsetEditing, toggleEditing] = useBooleanState(
        Boolean(node.attrs[MermaidConsts.NodeAttrs.newCreated]),
    );
    const [menuOpen, , , toggleMenuOpen] = useBooleanState(false);
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const waitForMermaid = () =>
            setTimeout(() => {
                const instance = getMermaidInstance();
                if (instance) {
                    setMermaidInstance(instance);

                    return;
                }

                waitForMermaid();
            }, 100);

        waitForMermaid();
    }, []);

    if (editing) {
        return (
            <DiagramEditMode
                initialText={node.attrs[MermaidConsts.NodeAttrs.content]}
                mermaidInstance={mermaidInstance}
                onCancel={unsetEditing}
                onSave={(v) => {
                    onChange({[MermaidConsts.NodeAttrs.content]: v});
                    unsetEditing();
                }}
            />
        );
    }

    return (
        <div className={b()} onDoubleClick={setEditing}>
            <MermaidPreview
                mermaidInstance={mermaidInstance}
                text={node.attrs[MermaidConsts.NodeAttrs.content]}
            />
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
