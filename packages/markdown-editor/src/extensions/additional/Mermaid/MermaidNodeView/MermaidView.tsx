import {useEffect, useMemo, useState} from 'react';

import {Ellipsis as DotsIcon} from '@gravity-ui/icons';
import {Button, Icon, Loader, Menu, Popup} from '@gravity-ui/uikit';
import type {Mermaid} from 'mermaid' with {'resolution-mode': 'import'};
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {SharedStateKey} from 'src/extensions/behavior/SharedState';
import {useSharedEditingState} from 'src/react-utils/useSharedEditingState';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useAutoSave, useBooleanState, useElementState} from '../../../../react-utils';
import {removeNode} from '../../../../utils';
import {MermaidConsts} from '../MermaidSpecs/const';
import type {MermaidOptions} from '../index';
import type {MermaidEntitySharedState} from '../types';

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
    options: MermaidOptions;
}> = ({initialText, onSave, onCancel, mermaidInstance, options: {autoSave}}) => {
    const {value, handleChange, handleManualSave, isSaveDisabled, isAutoSaveEnabled} = useAutoSave({
        initialValue: initialText || '',
        onSave,
        onClose: onCancel,
        autoSave,
    });

    return (
        <div className={b()}>
            <MermaidPreview mermaidInstance={mermaidInstance} text={value} />
            <div className={b('Editor')}>
                <div>
                    <TextArea
                        controlProps={{
                            className: STOP_EVENT_CLASSNAME,
                        }}
                        value={value}
                        onUpdate={handleChange}
                        autoFocus
                    />
                </div>
                <div className={b('Controls')}>
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

export const MermaidView: React.FC<{
    view: EditorView;
    onChange: (attrs: {[MermaidConsts.NodeAttrs.content]: string}) => void;
    getMermaidInstance: () => Mermaid;
    node: Node;
    getPos: () => number | undefined;
    options: MermaidOptions;
}> = ({onChange, node, getPos, view, getMermaidInstance, options}) => {
    const enitityId: string = node.attrs[MermaidConsts.NodeAttrs.EntityId];
    const entityKey = useMemo(
        () => SharedStateKey.define<MermaidEntitySharedState>({name: enitityId}),
        [enitityId],
    );

    const [editing, setEditing, unsetEditing] = useSharedEditingState(view, entityKey);
    const [menuOpen, , closeMenu, toggleMenuOpen] = useBooleanState(false);
    const [anchorElement, setAnchorElement] = useElementState();

    const [mermaidInstance, setMermaidInstance] = useState<Mermaid | null>(null);
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
                }}
                options={options}
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
