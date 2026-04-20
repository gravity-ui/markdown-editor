import {Suspense, lazy, useCallback, useMemo, useState} from 'react';

import {Ellipsis as DotsIcon} from '@gravity-ui/icons';
import {Button, Flex, Icon, Loader, Menu, Popup, type PopupPlacement} from '@gravity-ui/uikit';
import type {Node} from 'prosemirror-model';
import type {EditorView} from 'prosemirror-view';

import {SharedStateKey} from 'src/extensions/behavior/SharedState';
import {useSharedEditingState} from 'src/react-utils/useSharedEditingState';

import {cn} from '../../../../classname';
import {TextAreaFixed as TextArea} from '../../../../forms/TextInput';
import {i18n} from '../../../../i18n/common';
import {useAutoSave, useBooleanState, useElementState} from '../../../../react-utils';
import {YfmPageConstructorConsts} from '../YfmPageConstructorSpecs/const';
import type {YfmPageConstructorOptions} from '../index';
import type {YfmPageConstructorEntitySharedState} from '../types';

import type {TransformerOptions} from './YfmPageConstructorPreview';

import './YfmPageConstructor.scss';

export {type TransformerOptions};
export const cnYfmPageConstructor = cn('YfmPageConstructor');
export const STOP_EVENT_CLASSNAME = 'prosemirror-stop-event';

const b = cnYfmPageConstructor;

const popupPlacement: PopupPlacement = ['bottom-end'];

const YfmPageConstructorPreviewLazy = lazy(() =>
    // @ts-ignore error TS2835: Relative import paths need explicit file extensions in ECMAScript (cjs build)
    import('./YfmPageConstructorPreview').then((m) => ({default: m.YfmPageConstructorPreview})),
);

const YfmPageConstructorPreview: React.FC<{
    text: string;
    transformerOptions: TransformerOptions;
    className?: string;
}> = (props) => (
    <Suspense fallback={<Loader size="m" />}>
        <YfmPageConstructorPreviewLazy {...props} />
    </Suspense>
);

const PageConstructorEditMode: React.FC<{
    initialText: string;
    onSave: (v: string) => void;
    onCancel: () => void;
    autoSave: YfmPageConstructorOptions['autoSave'];
    transformerOptions: TransformerOptions;
}> = ({initialText, onSave, onCancel, autoSave, transformerOptions}) => {
    const {value, handleChange, handleManualSave, isSaveDisabled, isAutoSaveEnabled} = useAutoSave({
        initialValue: initialText || '',
        onSave,
        onClose: onCancel,
        autoSave,
    });

    return (
        <div className={`${b({edit: true})} ${STOP_EVENT_CLASSNAME}`}>
            <YfmPageConstructorPreview
                text={value}
                transformerOptions={transformerOptions}
                className={b('Constructor')}
            />
            <div className={b('Editor')} style={{whiteSpace: 'nowrap', caretColor: 'auto'}}>
                <TextArea
                    controlProps={{className: STOP_EVENT_CLASSNAME}}
                    value={value}
                    onUpdate={handleChange}
                    autoFocus
                />
                <Flex justifyContent="flex-end" spacing={{mt: 2}} className={b('Controls')}>
                    <Button onClick={onCancel} view="flat">
                        <span className={STOP_EVENT_CLASSNAME}>
                            {isAutoSaveEnabled ? i18n('close') : i18n('cancel')}
                        </span>
                    </Button>
                    {!isAutoSaveEnabled && (
                        <Button onClick={handleManualSave} view="action" disabled={isSaveDisabled}>
                            <span className={STOP_EVENT_CLASSNAME}>{i18n('save')}</span>
                        </Button>
                    )}
                </Flex>
            </div>
        </div>
    );
};

export const YfmPageConstructorView: React.FC<{
    view: EditorView;
    node: Node;
    onChange: (content: string) => void;
    onRemove: () => void;
    canEdit: boolean;
    autoSave: YfmPageConstructorOptions['autoSave'];
    transformerOptions: TransformerOptions;
}> = ({view, node, onChange, onRemove, canEdit, autoSave, transformerOptions}) => {
    const entityId: string = node.attrs[YfmPageConstructorConsts.NodeAttrs.EntityId];

    const entityKey = useMemo(
        () => SharedStateKey.define<YfmPageConstructorEntitySharedState>({name: entityId}),
        [entityId],
    );

    const [editing, setEditing, unsetEditing] = useSharedEditingState(view, entityKey);
    const [anchorElement, setAnchorElement] = useElementState();
    const [menuOpen, , closeMenu, toggleMenuOpen] = useBooleanState(false);

    // Local state mirrors ProseMirror attribute; updates preview optimistically
    const [content, setContent] = useState(
        () => node.attrs[YfmPageConstructorConsts.NodeAttrs.content] || '',
    );

    const handleChange = useCallback(
        (newContent: string) => {
            setContent(newContent);
            onChange(newContent);
        },
        [onChange],
    );

    if (editing) {
        return (
            <PageConstructorEditMode
                initialText={content}
                onCancel={unsetEditing}
                onSave={handleChange}
                autoSave={autoSave}
                transformerOptions={transformerOptions}
            />
        );
    }

    return (
        <div
            className={`${b()} ${STOP_EVENT_CLASSNAME}`}
            onDoubleClick={canEdit ? setEditing : undefined}
        >
            <YfmPageConstructorPreview
                text={content}
                transformerOptions={transformerOptions}
                className={b('Constructor')}
            />
            {canEdit && (
                <div className={b('Menu')}>
                    <Button
                        size="s"
                        onClick={toggleMenuOpen}
                        ref={setAnchorElement}
                        className={`${STOP_EVENT_CLASSNAME}`}
                        extraProps={{
                            onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
                        }}
                    >
                        <Icon data={DotsIcon} className={STOP_EVENT_CLASSNAME} />
                    </Button>
                    <Popup
                        open={menuOpen}
                        onClose={closeMenu}
                        placement={popupPlacement}
                        anchorElement={anchorElement}
                    >
                        <Menu>
                            <Menu.Item
                                onClick={() => {
                                    closeMenu();
                                    setEditing();
                                }}
                            >
                                {i18n('edit')}
                            </Menu.Item>
                            <Menu.Item
                                onClick={() => {
                                    closeMenu();
                                    onRemove();
                                }}
                            >
                                {i18n('remove')}
                            </Menu.Item>
                        </Menu>
                    </Popup>
                </div>
            )}
        </div>
    );
};
