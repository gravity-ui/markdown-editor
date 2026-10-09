import {useId, useRef, useState} from 'react';
import type {FC, KeyboardEvent, MouseEvent, RefObject} from 'react';

import {ChevronDown, Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Popup, TextArea, TextInput} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {cnYfmHtmlConstructor as b, STOP_EVENT_CLASSNAME as stop} from './const';
import {HTML_CONSTRUCTOR_ICONS} from './iconLibrary';
import {
    type EditableAttribute,
    editElementHtml,
    getEditableTextNode,
    getElementAttributes,
    isIconSizedSvg,
} from './textEditing';

const humanizeIconId = (id: string) =>
    id.replace(/-/g, ' ').replace(/^./, (char) => char.toUpperCase());

export const InlineElementEditor: FC<{
    root: HTMLElement;
    target: Element;
    anchorElement: HTMLElement | null;
    returnFocus: RefObject<HTMLElement>;
    onCommit: (html: string) => void;
    onClose: (restoreFocus?: boolean) => void;
}> = ({root, target, anchorElement, returnFocus, onCommit, onClose: cancelEditing}) => {
    const [initial] = useState(() => {
        const {node, canEdit} = getEditableTextNode(target);
        return {
            text: node?.nodeValue ?? '',
            canEditText: canEdit,
            iconPicker: target instanceof SVGSVGElement && isIconSizedSvg(target),
            attributes: getElementAttributes(target).map((attr, id) => ({...attr, id})),
        };
    });
    const {canEditText, iconPicker} = initial;
    const [editValue, setEditValue] = useState(initial.text);
    const [attrs, setAttrs] = useState(initial.attributes);
    const [attrsOpen, setAttrsOpen] = useState(!canEditText);
    const [pendingIcon, setPendingIcon] = useState<{id: string; markup: string} | null>(null);
    const [editError, setEditError] = useState('');
    const editControlRef = useRef<HTMLTextAreaElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const attrIdRef = useRef(attrs.length);
    const fieldId = useId();

    // Wait for positioning before focusing, without stealing focus from an early click.
    const selectEditControl = () => {
        const popup = popupRef.current;
        if (!popup || popup.contains(document.activeElement)) return;
        const control =
            editControlRef.current ?? popup.querySelector<HTMLElement>('input, textarea, button');
        if (!control) return;
        control.focus({preventScroll: true});
        if (control instanceof HTMLTextAreaElement) control.select();
    };

    const updateAttr = (id: number, patch: Partial<EditableAttribute>) => {
        setEditError('');
        setAttrs((rows) => rows.map((row) => (row.id === id ? {...row, ...patch} : row)));
    };

    const removeAttr = (id: number) => {
        setEditError('');
        setAttrs((rows) => rows.filter((row) => row.id !== id));
    };

    const addAttr = () => {
        const id = attrIdRef.current++;
        setAttrs((rows) => [...rows, {id, name: '', value: ''}]);
    };

    const commitEditing = () => {
        if (!root?.isConnected || !root.contains(target)) {
            setEditError(i18n('edit_target_changed'));
            return;
        }

        const html = editElementHtml(root, target, {
            attributes: attrs,
            text: canEditText ? editValue : undefined,
            icon: iconPicker ? pendingIcon?.markup : undefined,
        });
        if (html === null) {
            setEditError(i18n('invalid_attribute_name'));
            setAttrsOpen(true);
            return;
        }

        onCommit(html);
        cancelEditing();
    };

    const handleEditPopupKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelEditing();
            return;
        }

        if (event.key !== 'Enter') return;

        if (event.shiftKey || event.metaKey || event.ctrlKey) return;

        event.preventDefault();
        event.stopPropagation();
        commitEditing();
    };

    const handleIconSelect = (event: MouseEvent<HTMLButtonElement>, id: string) => {
        // UIKit may wrap the glyph in another SVG.
        const svgs = event.currentTarget.querySelectorAll('svg');
        const svg = svgs[svgs.length - 1];
        if (!svg) return;

        setPendingIcon({id, markup: svg.outerHTML});
    };

    const renderTextField = () => {
        if (!canEditText) {
            return <div className={`${b('inline-edit-hint')} ${stop}`}>{i18n('no_text')}</div>;
        }

        return (
            <div className={`${b('inline-edit-field')} ${stop}`}>
                <label className={b('inline-edit-field-label')} htmlFor={fieldId}>
                    {i18n('text')}
                </label>
                <TextArea
                    controlRef={editControlRef}
                    id={fieldId}
                    controlProps={{className: stop}}
                    onKeyDown={handleEditPopupKeyDown}
                    value={editValue}
                    onUpdate={setEditValue}
                    minRows={4}
                    maxRows={4}
                />
            </div>
        );
    };

    const renderAttributes = () => {
        return (
            <div className={`${b('inline-edit-section')} ${stop}`}>
                <button
                    type="button"
                    className={`${b('inline-edit-toggle')} ${stop}`}
                    aria-expanded={attrsOpen}
                    aria-controls={`${fieldId}-attributes`}
                    onClick={() => setAttrsOpen((open) => !open)}
                >
                    <Icon
                        data={ChevronDown}
                        size={14}
                        className={`${b('inline-edit-toggle-chevron', {open: attrsOpen})} ${stop}`}
                    />
                    {i18n('attributes')}
                    <span className={b('inline-edit-toggle-count')}>{attrs.length}</span>
                </button>
                {attrsOpen && (
                    <div
                        id={`${fieldId}-attributes`}
                        className={`${b('inline-edit-attrs')} ${stop}`}
                    >
                        {attrs.map((row) => (
                            <div key={row.id} className={`${b('inline-edit-attr-row')} ${stop}`}>
                                <TextInput
                                    size="s"
                                    controlProps={{
                                        className: stop,
                                        'aria-label': i18n('attribute_name'),
                                    }}
                                    onKeyDown={handleEditPopupKeyDown}
                                    value={row.name}
                                    onUpdate={(name) => updateAttr(row.id, {name})}
                                    placeholder={i18n('attribute_name')}
                                />
                                <TextInput
                                    size="s"
                                    controlProps={{
                                        className: stop,
                                        'aria-label': `${i18n('attribute_value')}: ${row.name}`,
                                    }}
                                    onKeyDown={handleEditPopupKeyDown}
                                    value={row.value}
                                    onUpdate={(value) => updateAttr(row.id, {value})}
                                    placeholder={i18n('attribute_value')}
                                />
                                <Button
                                    view="flat"
                                    size="s"
                                    className={stop}
                                    onClick={() => removeAttr(row.id)}
                                    aria-label={i18n('remove_attribute')}
                                    title={i18n('remove_attribute')}
                                >
                                    <Icon data={TrashBin} size={14} className={stop} />
                                </Button>
                            </div>
                        ))}
                        <Button view="flat" size="s" width="max" className={stop} onClick={addAttr}>
                            <Icon data={Plus} size={14} className={stop} />
                            {i18n('add_attribute')}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    const renderIconPicker = () => {
        if (!iconPicker) return null;

        return (
            <div className={`${b('inline-edit-section')} ${stop}`}>
                <div className={b('inline-edit-field-label')}>{i18n('icon')}</div>
                <div className={`${b('inline-edit-icons')} ${stop}`}>
                    {HTML_CONSTRUCTOR_ICONS.map((icon) => (
                        <button
                            key={icon.id}
                            type="button"
                            className={`${b('inline-edit-icon', {
                                active: pendingIcon?.id === icon.id,
                            })} ${stop}`}
                            title={humanizeIconId(icon.id)}
                            aria-label={humanizeIconId(icon.id)}
                            aria-pressed={pendingIcon?.id === icon.id}
                            onClick={(event) => handleIconSelect(event, icon.id)}
                        >
                            <Icon data={icon.data} size={20} className={stop} />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Popup
            open={Boolean(anchorElement)}
            anchorElement={anchorElement}
            returnFocus={returnFocus}
            placement={['bottom-start', 'top-start']}
            onTransitionInComplete={selectEditControl}
            onOpenChange={(open) => {
                if (!open) cancelEditing(false);
            }}
        >
            <div
                data-hc-ui
                ref={popupRef}
                className={`${b('inline-edit-popup')} ${stop}`}
                role="dialog"
                tabIndex={-1}
                aria-label={i18n('edit_element')}
            >
                {renderTextField()}
                {renderAttributes()}
                {renderIconPicker()}
                {editError && <div role="alert">{editError}</div>}
                <div className={`${b('inline-edit-popup-actions')} ${stop}`}>
                    <Button view="flat" size="s" className={stop} onClick={() => cancelEditing()}>
                        {i18n('cancel')}
                    </Button>
                    <Button view="action" size="s" className={stop} onClick={commitEditing}>
                        {i18n('save')}
                    </Button>
                </div>
            </div>
        </Popup>
    );
};
