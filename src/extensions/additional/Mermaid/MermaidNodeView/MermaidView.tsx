import {useEffect, useState} from 'react';

import {Ellipsis as DotsIcon} from '@gravity-ui/icons';
import {Button, Icon, Loader, Menu, Popup} from '@gravity-ui/uikit';
import type {Mermaid} from 'mermaid' with {'resolution-mode': 'import'};
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useBooleanState, useElementState} from '../../../../react-utils';
import {removeNode} from '../../../../utils';
import {MermaidConsts} from '../MermaidSpecs/const';
export const cnMermaid = cn('Mermaid');

export const STOP_EVENT_CLASSNAME = 'prosemirror-stop-event';

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
                            className: STOP_EVENT_CLASSNAME,
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
    const [menuOpen, , closeMenu, toggleMenuOpen] = useBooleanState(false);
    const [anchorElement, setAnchorElement] = useElementState();

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
                    ref={setAnchorElement}
                    size={'s'}
                    className={STOP_EVENT_CLASSNAME}
                >
                    <Icon data={DotsIcon} className={STOP_EVENT_CLASSNAME} />
                </Button>
                <Popup
                    open={menuOpen}
                    anchorElement={anchorElement}
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
