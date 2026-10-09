import {useEffect, useMemo, useState} from 'react';

import {Ellipsis as DotsIcon} from '@gravity-ui/icons';
import {
    SharedStateKey,
    cn,
    removeNode,
    useAutoSave,
    useBooleanState,
    useElementState,
    useSharedEditingState,
} from '@gravity-ui/markdown-editor';
import {DelayedTextArea} from '@gravity-ui/markdown-editor/_/react-utils/components/DelayedTextArea.js';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {Button, Icon, Loader, Menu, Overlay, Popup, useThemeType} from '@gravity-ui/uikit';
import type {Mermaid} from 'mermaid' with {'resolution-mode': 'import'};

import {i18n} from '../../i18n';
import {MermaidConsts} from '../MermaidSpecs/const';
import type {MermaidExtensionOptions} from '../index';
import type {MermaidEntitySharedState} from '../types';

import './Mermaid.scss';

export const STOP_EVENT_CLASSNAME = 'prosemirror-stop-event';

const b = cn('Mermaid');

const MermaidPreview: React.FC<{
    mermaidInstance: Mermaid | null;
    text: string;
    options: MermaidExtensionOptions;
}> = ({mermaidInstance, text = '', options}) => {
    const [svg, setSvg] = useState<string>();
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const theme = useThemeType();

    useEffect(() => {
        if (!mermaidInstance) return undefined;

        let cancelled = false;
        setUpdating(true);

        const run = async () => {
            try {
                // Validates syntax and throws error if text is invalid
                await mermaidInstance.parse(text);

                if (options.theme) {
                    mermaidInstance.initialize({
                        theme: theme === 'dark' ? options.theme.dark : options.theme.light,
                    });
                }

                const {svg: S} = await mermaidInstance.render(`mermaid-${Date.now()}`, text);

                if (cancelled) return;
                setSvg(S);
                setUpdating(false);
                setError(null);
            } catch (e) {
                if (cancelled) return;
                setUpdating(false);
                setError((e as Error).message);
            }
        };

        const hasRIC = typeof requestIdleCallback === 'function';
        const handle = hasRIC
            ? requestIdleCallback(() => run())
            : requestAnimationFrame(() => run());

        return () => {
            cancelled = true;
            if (hasRIC) cancelIdleCallback(handle);
            else cancelAnimationFrame(handle);
        };
    }, [mermaidInstance, text, theme, options.theme]);

    if (error) {
        return <div className={b('Error')}>{error && <div>{error}</div>}</div>;
    }

    const loading = !svg || updating;

    return (
        <div className={b('Preview', {loading})}>
            {svg && <div className="mermaid" dangerouslySetInnerHTML={{__html: svg}} />}
            <Overlay visible={loading}>
                <Loader />
            </Overlay>
        </div>
    );
};

const DiagramEditMode: React.FC<{
    initialText: string;
    mermaidInstance: Mermaid | null;
    onSave: (v: string) => void;
    onCancel: () => void;
    options: MermaidExtensionOptions;
}> = ({initialText, onSave, onCancel, mermaidInstance, options}) => {
    const {value, handleChange, handleManualSave, isSaveDisabled, isAutoSaveEnabled} = useAutoSave({
        initialValue: initialText || '',
        onSave,
        onClose: onCancel,
        autoSave: options.autoSave,
    });

    return (
        <div className={b()}>
            <MermaidPreview mermaidInstance={mermaidInstance} text={value} options={options} />
            <div className={b('Editor')}>
                <div>
                    <DelayedTextArea
                        controlProps={{
                            className: STOP_EVENT_CLASSNAME,
                        }}
                        value={value}
                        onUpdate={handleChange}
                        delay={400}
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
    options: MermaidExtensionOptions;
}> = ({onChange, node, getPos, view, getMermaidInstance, options}) => {
    const entityId: string = node.attrs[MermaidConsts.NodeAttrs.EntityId];
    const entityKey = useMemo(
        () => SharedStateKey.define<MermaidEntitySharedState>({name: entityId}),
        [entityId],
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
                options={options}
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
