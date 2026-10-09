import {useEffect, useRef, useState} from 'react';
import type {CSSProperties, FocusEvent, KeyboardEvent, MouseEvent} from 'react';

import {Pencil} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import {InlineElementEditor} from './InlineElementEditor';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import {getFirstEditableElement} from './textEditing';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;
const inlineEditButtonSelector = `.${b('inline-edit-button')}`;

interface InlineEditTarget {
    element: Element;
    buttonStyle: CSSProperties;
    outlineStyle: CSSProperties;
}

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

const INLINE_EDIT_OUTLINE_PADDING = 4;
const INLINE_EDIT_BUTTON_SIZE = 28;

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

export const useInlineHtmlEditing = ({onCommit}: {onCommit: (html: string) => void}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const boundsRef = useRef<HTMLDivElement>(null);
    const [inlineEditTarget, setInlineEditTarget] = useState<InlineEditTarget | null>(null);
    const [editTarget, setEditTarget] = useState<InlineEditTarget | null>(null);
    const [editAnchor, setEditAnchor] = useState<HTMLDivElement | null>(null);
    const focusFrameRef = useRef<number>();

    useEffect(
        () => () => {
            if (focusFrameRef.current !== undefined) {
                cancelAnimationFrame(focusFrameRef.current);
            }
        },
        [],
    );

    const resolveTarget = (target: EventTarget | null) => {
        const root = contentRef.current;
        const bounds = boundsRef.current;
        if (!root || !bounds) return null;
        return getInlineEditTarget(root, bounds, target);
    };

    const handleContentMouseMove = (event: MouseEvent<HTMLElement>) => {
        if (editTarget) return;

        const root = contentRef.current;
        const bounds = boundsRef.current;
        if (!root || !bounds) return;
        const element = getEditableElement(root, event.target);
        if (!element || element === inlineEditTarget?.element) return;
        setInlineEditTarget({element, ...getTargetStyles(bounds, element)});
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

    const handleContentFocus = (event: FocusEvent<HTMLElement>) => {
        if (editTarget || event.target !== event.currentTarget) return;
        const root = contentRef.current;
        if (!root) return;
        setInlineEditTarget(resolveTarget(getFirstEditableElement(root)));
    };

    const handleContentBlur = (event: FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        clearInlineEditTarget();
    };

    const cancelEditing = (restoreFocus = true) => {
        setEditTarget(null);
        if (focusFrameRef.current !== undefined) cancelAnimationFrame(focusFrameRef.current);
        if (restoreFocus) {
            focusFrameRef.current = requestAnimationFrame(() => {
                boundsRef.current?.focus({preventScroll: true});
                focusFrameRef.current = undefined;
            });
        }
    };

    const openInlineEditTarget = (target: InlineEditTarget) => {
        if (!contentRef.current?.contains(target.element)) return false;

        if (focusFrameRef.current !== undefined) {
            cancelAnimationFrame(focusFrameRef.current);
            focusFrameRef.current = undefined;
        }

        setEditTarget(target);
        setInlineEditTarget(null);

        return true;
    };

    const handleOpenInlineEdit = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!inlineEditTarget) return;

        openInlineEditTarget(inlineEditTarget);
    };

    const handleContentClick = (event: MouseEvent<HTMLElement>) => {
        if (editTarget) return;
        const target = resolveTarget(event.target);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
    };

    const handleContentKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (editTarget || event.nativeEvent.isComposing || event.keyCode === 229) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;

        const root = contentRef.current;
        if (
            !root ||
            !(event.target instanceof Element) ||
            !event.currentTarget.contains(event.target) ||
            event.target.closest(inlineEditButtonSelector)
        ) {
            return;
        }

        const isContainer = event.target === event.currentTarget || event.target === root;
        const target = resolveTarget(isContainer ? getFirstEditableElement(root) : event.target);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        openInlineEditTarget(target);
    };

    const overlay = (
        <>
            {inlineEditTarget && !editTarget && (
                <>
                    <div
                        data-hc-ui
                        className={b('inline-edit-outline')}
                        style={inlineEditTarget.outlineStyle}
                    />
                    <button
                        data-hc-ui
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
                        data-hc-ui
                        ref={setEditAnchor}
                        className={b('inline-edit-outline', {active: true})}
                        style={editTarget.outlineStyle}
                    />
                    {contentRef.current && (
                        <InlineElementEditor
                            root={contentRef.current}
                            target={editTarget.element}
                            anchorElement={editAnchor}
                            returnFocus={boundsRef}
                            onCommit={onCommit}
                            onClose={cancelEditing}
                        />
                    )}
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
            onFocus: handleContentFocus,
            onBlur: handleContentBlur,
            onMouseLeave: clearInlineEditTarget,
        },
        overlay,
    };
};
