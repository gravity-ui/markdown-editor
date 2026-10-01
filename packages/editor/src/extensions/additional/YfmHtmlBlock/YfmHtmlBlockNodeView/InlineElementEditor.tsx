import {useId, useRef, useState} from 'react';
import type {KeyboardEvent, RefObject} from 'react';

import {ChevronDown, Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Popup, TextArea, TextInput} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-block';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock as b} from './const';
import {
    type EditableAttribute,
    editElementHtml,
    getEditableTextNode,
    getElementAttributes,
    getMatchingElements,
} from './textEditing';

export const InlineElementEditor: React.FC<{
    sourceHtml: string;
    previewRoot: HTMLElement;
    target: Element;
    anchorElement: HTMLElement | null;
    returnFocus: RefObject<HTMLElement>;
    onCommit: (html: string) => void;
    onClose: () => void;
}> = ({sourceHtml, previewRoot, target, anchorElement, returnFocus, onCommit, onClose}) => {
    const [initial] = useState(() => {
        const matching = getMatchingElements(sourceHtml, previewRoot);
        const sourceTarget =
            matching?.sourceElements[matching.previewElements.indexOf(target)] ?? target;
        const {node, canEdit} = getEditableTextNode(sourceTarget);
        return {
            text: node?.nodeValue ?? '',
            canEditText: canEdit,
            attributes: getElementAttributes(sourceTarget).map((attr, id) => ({...attr, id})),
        };
    });
    const [text, setText] = useState(initial.text);
    const [attributes, setAttributes] = useState(initial.attributes);
    const [attributesOpen, setAttributesOpen] = useState(!initial.canEditText);
    const [error, setError] = useState('');
    const nextId = useRef(attributes.length);
    const popupRef = useRef<HTMLDivElement>(null);
    const fieldId = useId();

    const updateAttribute = (id: number, patch: Partial<EditableAttribute>) => {
        setError('');
        setAttributes((rows) => rows.map((row) => (row.id === id ? {...row, ...patch} : row)));
    };

    const commit = () => {
        if (!previewRoot.isConnected || !previewRoot.contains(target)) {
            setError(i18n('edit_target_changed'));
            return;
        }
        const html = editElementHtml(sourceHtml, previewRoot, target, {
            text: initial.canEditText ? text : undefined,
            attributes,
        });
        if (html === null) {
            setError(i18n('invalid_attribute_name'));
            setAttributesOpen(true);
            return;
        }
        onCommit(html);
        onClose();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        } else if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            event.stopPropagation();
            commit();
        }
    };

    return (
        <Popup
            open={Boolean(anchorElement)}
            anchorElement={anchorElement}
            returnFocus={returnFocus}
            placement={['bottom-start', 'top-start']}
            onTransitionInComplete={() => {
                const control = popupRef.current?.querySelector<HTMLElement>('textarea, input');
                control?.focus({preventScroll: true});
                if (control instanceof HTMLTextAreaElement) control.select();
            }}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <div
                ref={popupRef}
                className={`${b('inline-edit-popup')} ${STOP_EVENT_CLASSNAME}`}
                role="dialog"
                aria-label={i18n('edit_element')}
            >
                {initial.canEditText && (
                    <div className={b('inline-edit-field')}>
                        <label className={b('inline-edit-field-label')} htmlFor={fieldId}>
                            {i18n('text')}
                        </label>
                        <TextArea
                            id={fieldId}
                            controlProps={{className: STOP_EVENT_CLASSNAME}}
                            value={text}
                            onUpdate={setText}
                            onKeyDown={onKeyDown}
                            minRows={4}
                            maxRows={4}
                        />
                    </div>
                )}
                <div className={b('inline-edit-section')}>
                    <button
                        type="button"
                        className={`${b('inline-edit-toggle')} ${STOP_EVENT_CLASSNAME}`}
                        aria-expanded={attributesOpen}
                        aria-controls={`${fieldId}-attributes`}
                        onClick={() => setAttributesOpen((open) => !open)}
                    >
                        <Icon
                            data={ChevronDown}
                            size={14}
                            className={b('inline-edit-toggle-chevron', {open: attributesOpen})}
                        />
                        {i18n('attributes')}
                        <span className={b('inline-edit-toggle-count')}>{attributes.length}</span>
                    </button>
                    {attributesOpen && (
                        <div id={`${fieldId}-attributes`} className={b('inline-edit-attrs')}>
                            {attributes.map((row) => (
                                <div key={row.id} className={b('inline-edit-attr-row')}>
                                    <TextInput
                                        size="s"
                                        controlProps={{
                                            className: STOP_EVENT_CLASSNAME,
                                            'aria-label': i18n('attribute_name'),
                                        }}
                                        value={row.name}
                                        onUpdate={(name) => updateAttribute(row.id, {name})}
                                        onKeyDown={onKeyDown}
                                        placeholder={i18n('attribute_name')}
                                    />
                                    <TextInput
                                        size="s"
                                        controlProps={{
                                            className: STOP_EVENT_CLASSNAME,
                                            'aria-label': `${i18n('attribute_value')}: ${row.name}`,
                                        }}
                                        value={row.value}
                                        onUpdate={(value) => updateAttribute(row.id, {value})}
                                        onKeyDown={onKeyDown}
                                        placeholder={i18n('attribute_value')}
                                    />
                                    <Button
                                        view="flat"
                                        size="s"
                                        className={STOP_EVENT_CLASSNAME}
                                        aria-label={i18n('remove_attribute')}
                                        onClick={() =>
                                            setAttributes((rows) =>
                                                rows.filter((item) => item.id !== row.id),
                                            )
                                        }
                                    >
                                        <Icon data={TrashBin} size={14} />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                view="flat"
                                size="s"
                                width="max"
                                className={STOP_EVENT_CLASSNAME}
                                onClick={() =>
                                    setAttributes((rows) => [
                                        ...rows,
                                        {id: nextId.current++, name: '', value: ''},
                                    ])
                                }
                            >
                                <Icon data={Plus} size={14} />
                                {i18n('add_attribute')}
                            </Button>
                        </div>
                    )}
                </div>
                {error && <div role="alert">{error}</div>}
                <div className={b('inline-edit-popup-actions')}>
                    <Button view="flat" size="s" className={STOP_EVENT_CLASSNAME} onClick={onClose}>
                        {i18n('cancel')}
                    </Button>
                    <Button
                        view="action"
                        size="s"
                        className={STOP_EVENT_CLASSNAME}
                        onClick={commit}
                    >
                        {i18n('save')}
                    </Button>
                </div>
            </div>
        </Popup>
    );
};
