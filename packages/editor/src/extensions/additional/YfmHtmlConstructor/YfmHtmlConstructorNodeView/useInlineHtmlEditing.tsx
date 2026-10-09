import {useRef, useState} from 'react';
import type {
    CSSProperties,
    FocusEvent,
    KeyboardEvent,
    MouseEvent,
    ReactNode,
    RefObject,
} from 'react';

import {ChevronDown, Pencil, Plus, TrashBin} from '@gravity-ui/icons';
import {Button, Icon, Popup, TextArea, TextInput} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {HTML_CONSTRUCTOR_ICONS} from './iconLibrary';
import {
    type EditableAttribute,
    applyElementAttributes,
    getEditableTextNode,
    getElementAttributes,
    isIconSizedSvg,
    setElementText,
    setSvgIcon,
} from './textEditing';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const inlineEditButtonSelector = `.${b('inline-edit-button')}`;

interface InlineEditTarget {
    element: Element;
    buttonStyle: CSSProperties;
    outlineStyle: CSSProperties;
}

interface EditTarget {
    element: Element;
    anchor: HTMLElement;
    outlineStyle: CSSProperties;
    textNode: Text | null;
    canEditText: boolean;
    /** Inline SVG sized as an icon — offer the glyph picker. */
    iconPicker: boolean;
}

interface AttrRow extends EditableAttribute {
    id: number;
}

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

const INLINE_EDIT_OUTLINE_PADDING = 4;
const INLINE_EDIT_BUTTON_SIZE = 28;

// `bounds` is the positioned container the overlay is rendered into; the returned
// coordinates are relative to it.
const getTargetStyles = (bounds: HTMLElement, target: Element) => {
    const rect = bounds.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const left = targetRect.left - rect.left;
    const top = targetRect.top - rect.top;

    const outlineLeft = Math.max(0, left - INLINE_EDIT_OUTLINE_PADDING);
    const outlineTop = Math.max(0, top - INLINE_EDIT_OUTLINE_PADDING);
    const outlineWidth = targetRect.width + INLINE_EDIT_OUTLINE_PADDING * 2;
    const outlineHeight = targetRect.height + INLINE_EDIT_OUTLINE_PADDING * 2;

    return {
        buttonStyle: {
            // A compact badge pinned to the highlight's top-right corner, nudged
            // outward so it rests on the corner rather than on top of the content.
            left: clamp(
                outlineLeft + outlineWidth - INLINE_EDIT_BUTTON_SIZE + 8,
                4,
                rect.width - INLINE_EDIT_BUTTON_SIZE,
            ),
            top: clamp(outlineTop - 8, 0, rect.height - INLINE_EDIT_BUTTON_SIZE),
        },
        outlineStyle: {
            left: outlineLeft,
            top: outlineTop,
            width: outlineWidth,
            height: outlineHeight,
        },
    };
};

/**
 * The most specific editable element under the cursor. Any element inside the
 * content is editable (text + attributes); inner SVG shapes resolve to their
 * owning `<svg>` so the glyph is edited as a whole. The content root itself is
 * never a target.
 */
const getEditableElement = (root: HTMLElement, target: EventTarget | null): Element | null => {
    if (!(target instanceof Element) || target.closest(inlineEditButtonSelector)) return null;

    const ownerSvg = target.closest('svg');
    const element = ownerSvg && root.contains(ownerSvg) ? ownerSvg : target;

    if (element === root || !root.contains(element)) return null;

    return element;
};

const getInlineEditTarget = (
    root: HTMLElement,
    bounds: HTMLElement,
    target: EventTarget | null,
): InlineEditTarget | null => {
    const element = getEditableElement(root, target);
    if (!element) return null;

    return {element, ...getTargetStyles(bounds, element)};
};

const humanizeIconId = (id: string) =>
    id.replace(/-/g, ' ').replace(/^./, (char) => char.toUpperCase());

export interface InlineHtmlEditingApi {
    /** Ref for the element that owns the editable HTML (hit-testing + serialization). */
    contentRef: RefObject<HTMLDivElement>;
    /** Ref for the positioned container the edit overlay is rendered into. */
    boundsRef: RefObject<HTMLDivElement>;
    /** Event handlers to spread on the interactive container. */
    containerHandlers: {
        onClick: (event: MouseEvent<HTMLElement>) => void;
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
        onMouseMove: (event: MouseEvent<HTMLElement>) => void;
        onMouseOut: (event: MouseEvent<HTMLElement>) => void;
        onBlur: (event: FocusEvent<HTMLElement>) => void;
        onMouseLeave: () => void;
    };
    /** The hover affordance + edit popup, rendered inside the bounds container. */
    overlay: ReactNode;
}

export const useInlineHtmlEditing = ({
    onCommit,
}: {
    onCommit: (html: string) => void;
}): InlineHtmlEditingApi => {
    const contentRef = useRef<HTMLDivElement>(null);
    const boundsRef = useRef<HTMLDivElement>(null);
    const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [editValue, setEditValue] = useState('');
    const [attrs, setAttrs] = useState<AttrRow[]>([]);
    const [attrsOpen, setAttrsOpen] = useState(false);
    const [pendingIcon, setPendingIcon] = useState<{id: string; markup: string} | null>(null);
    const editControlRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
    const attrIdRef = useRef(0);

    const nextAttrId = () => {
        attrIdRef.current += 1;
        return attrIdRef.current;
    };

    const toAttrRows = (attributes: EditableAttribute[]): AttrRow[] =>
        attributes.map((attr) => ({...attr, id: nextAttrId()}));

    // Focus and select the field once the popup has finished opening (and is thus
    // positioned). We focus it ourselves with `preventScroll` instead of relying on
    // the Popup's `initialFocus`, because the focus manager would focus the control
    // while the popup is still at its initial (0,0) position and without
    // `preventScroll`, scrolling the page to the top to reveal it.
    const selectEditControl = () => {
        const control = editControlRef.current;
        if (!control) return;
        control.focus({preventScroll: true});
        control.select();
    };

    const resolveTarget = (target: EventTarget | null) => {
        const root = contentRef.current;
        const bounds = boundsRef.current;
        if (!root || !bounds) return null;
        return getInlineEditTarget(root, bounds, target);
    };

    const handleContentMouseMove = (event: MouseEvent<HTMLElement>) => {
        if (editTarget) return;

        const nextTarget = resolveTarget(event.target);
        if (!nextTarget) return;

        setInlineEditTarget((currentTarget) => {
            if (currentTarget?.element === nextTarget.element) return currentTarget;

            return nextTarget;
        });
    };

    const handleContentMouseOut = (event: MouseEvent<HTMLElement>) => {
        const element = inlineEditTarget?.element;
        if (!element || !(event.target instanceof Node) || !element.contains(event.target)) return;

        const nextElement = event.relatedTarget;
        if (
            nextElement instanceof Node &&
            (element.contains(nextElement) ||
                (nextElement instanceof Element && nextElement.closest(inlineEditButtonSelector)))
        ) {
            return;
        }

        setInlineEditTarget(null);
    };

    const clearInlineEditTarget = () => setInlineEditTarget(null);

    // Keep the edit affordance when focus moves to one of its own controls (the
    // pencil button). Otherwise pressing the button would blur the content and
    // unmount the button between mousedown and mouseup, swallowing the click.
    const handleContentBlur = (event: FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        clearInlineEditTarget();
    };

    const cancelEditing = () => {
        setEditTarget(null);
        setPendingIcon(null);
    };

    const updateAttr = (id: number, patch: Partial<EditableAttribute>) => {
        setAttrs((rows) => rows.map((row) => (row.id === id ? {...row, ...patch} : row)));
    };

    const removeAttr = (id: number) => {
        setAttrs((rows) => rows.filter((row) => row.id !== id));
    };

    const addAttr = () => {
        setAttrs((rows) => [...rows, {id: nextAttrId(), name: '', value: ''}]);
    };

    const commitEditing = () => {
        const root = contentRef.current;
        if (!root || !editTarget) {
            cancelEditing();
            return;
        }

        let element: Element = editTarget.element;

        // Replacing an icon's glyph is the primary action; the new glyph keeps its
        // own geometry (setSvgIcon carries class/style/width/height), so the
        // attribute editor is not re-applied on top of it.
        if (editTarget.iconPicker && pendingIcon) {
            const next = setSvgIcon(element as SVGSVGElement, pendingIcon.markup);
            if (next) element = next;
        } else {
            if (editTarget.canEditText) {
                setElementText(element, editTarget.textNode, editValue);
            }
            applyElementAttributes(
                element,
                attrs.map(({name, value}) => ({name: name.trim(), value})),
            );
        }

        onCommit(root.innerHTML);
        cancelEditing();
    };

    const handleEditPopupKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelEditing();
            return;
        }

        if (event.key !== 'Enter') return;

        // Shift/Ctrl/Cmd+Enter inserts a newline (handled natively by the textarea);
        // plain Enter saves and closes the popup.
        if (event.shiftKey || event.metaKey || event.ctrlKey) return;

        event.preventDefault();
        commitEditing();
    };

    // Editing happens in a popup anchored to the element rather than inline, so the
    // content keeps its place (no layout jump) while the user types.
    const openInlineEditTarget = (target: InlineEditTarget) => {
        if (!contentRef.current) return false;

        const {element, outlineStyle} = target;
        const {node, canEdit} = getEditableTextNode(element);
        const iconPicker = element instanceof SVGSVGElement && isIconSizedSvg(element);

        setEditTarget({
            element,
            anchor: element as unknown as HTMLElement,
            outlineStyle,
            textNode: node,
            canEditText: canEdit,
            iconPicker,
        });
        setEditValue(node?.nodeValue ?? '');
        setAttrs(toAttrRows(getElementAttributes(element)));
        // Lead with attributes when there is no text to edit (media, wrappers).
        setAttrsOpen(!canEdit);
        setPendingIcon(null);
        setInlineEditTarget(null);

        return true;
    };

    const handleIconSelect = (event: MouseEvent<HTMLButtonElement>, id: string) => {
        // `<Icon>` wraps the glyph in an extra `<svg>`; take the innermost (deepest)
        // one so we embed the real icon markup, not the wrapper.
        const svgs = event.currentTarget.querySelectorAll('svg');
        const svg = svgs[svgs.length - 1];
        if (!svg) return;

        setPendingIcon({id, markup: svg.outerHTML});
    };

    const handleOpenInlineEdit = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!inlineEditTarget) return;

        openInlineEditTarget(inlineEditTarget);
    };

    const handleContentClick = (event: MouseEvent<HTMLElement>) => {
        // A single click opens the editor for any element under the cursor. The
        // hover affordance already hints that the content is editable.
        const target = resolveTarget(event.target);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
    };

    const handleContentKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        if (!(event.target instanceof Element) || event.target.closest(inlineEditButtonSelector)) {
            return;
        }

        const target = resolveTarget(event.target) ?? inlineEditTarget;
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
    };

    const renderTextField = () => {
        if (!editTarget) return null;

        if (!editTarget.canEditText) {
            return <div className={`${b('inline-edit-hint')} ${stop}`}>{i18n('no_text')}</div>;
        }

        return (
            <div className={`${b('inline-edit-field')} ${stop}`}>
                <div className={b('inline-edit-field-label')}>{i18n('text')}</div>
                <TextArea
                    controlRef={editControlRef}
                    controlProps={{className: stop}}
                    onKeyDown={handleEditPopupKeyDown}
                    value={editValue}
                    onUpdate={setEditValue}
                    minRows={1}
                    maxRows={8}
                />
            </div>
        );
    };

    const renderAttributes = () => {
        if (!editTarget) return null;

        return (
            <div className={`${b('inline-edit-section')} ${stop}`}>
                <button
                    type="button"
                    className={`${b('inline-edit-toggle')} ${stop}`}
                    aria-expanded={attrsOpen}
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
                    <div className={`${b('inline-edit-attrs')} ${stop}`}>
                        {attrs.map((row) => (
                            <div key={row.id} className={`${b('inline-edit-attr-row')} ${stop}`}>
                                <TextInput
                                    size="s"
                                    controlProps={{className: stop}}
                                    value={row.name}
                                    onUpdate={(name) => updateAttr(row.id, {name})}
                                    placeholder={i18n('attribute_name')}
                                />
                                <TextInput
                                    size="s"
                                    controlProps={{className: stop}}
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
        if (!editTarget?.iconPicker) return null;

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
                            aria-label={i18n('edit_icon')}
                            onClick={(event) => handleIconSelect(event, icon.id)}
                        >
                            <Icon data={icon.data} size={20} className={stop} />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const overlay = (
        <>
            {inlineEditTarget && !editTarget && (
                <>
                    <div
                        className={b('inline-edit-outline')}
                        style={inlineEditTarget.outlineStyle}
                    />
                    <button
                        type="button"
                        className={`${b('inline-edit-button')} ${stop}`}
                        style={inlineEditTarget.buttonStyle}
                        onClick={handleOpenInlineEdit}
                        aria-label={i18n('edit_element')}
                    >
                        <Icon data={Pencil} size={15} className={stop} />
                    </button>
                </>
            )}
            {editTarget && (
                <>
                    <div
                        className={b('inline-edit-outline', {active: true})}
                        style={editTarget.outlineStyle}
                    />
                    <Popup
                        open
                        anchorElement={editTarget.anchor}
                        placement={['bottom-start', 'top-start', 'bottom', 'top']}
                        onTransitionInComplete={selectEditControl}
                        onOpenChange={(open) => {
                            if (!open) cancelEditing();
                        }}
                    >
                        <div className={`${b('inline-edit-popup')} ${stop}`}>
                            {renderTextField()}
                            {renderAttributes()}
                            {renderIconPicker()}
                            <div className={`${b('inline-edit-popup-actions')} ${stop}`}>
                                <Button
                                    view="flat"
                                    size="s"
                                    className={stop}
                                    onClick={cancelEditing}
                                >
                                    {i18n('cancel')}
                                </Button>
                                <Button
                                    view="action"
                                    size="s"
                                    className={stop}
                                    onClick={commitEditing}
                                >
                                    {i18n('save')}
                                </Button>
                            </div>
                        </div>
                    </Popup>
                </>
            )}
        </>
    );

    return {
        contentRef,
        boundsRef,
        containerHandlers: {
            onClick: handleContentClick,
            onKeyDown: handleContentKeyDown,
            onMouseMove: handleContentMouseMove,
            onMouseOut: handleContentMouseOut,
            onBlur: handleContentBlur,
            onMouseLeave: clearInlineEditTarget,
        },
        overlay,
    };
};
