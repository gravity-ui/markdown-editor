import {useEffect, useRef, useState} from 'react';
import type {CSSProperties, RefObject} from 'react';

import {Pencil} from '@gravity-ui/icons';
import {Icon, Portal} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-block';

import {InlineElementEditor} from './InlineElementEditor';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock as b} from './const';
import {getElementAttributes, getMatchingElements} from './textEditing';

interface Target {
    element: Element;
    outline: CSSProperties;
    anchor: CSSProperties;
    button: CSSProperties;
    attributes: string;
}

interface Selection extends Target {
    id: number;
}

const HIGHLIGHT_PADDING = 10;

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

export const FrameInlineEditing: React.FC<{
    frameRef: RefObject<HTMLIFrameElement>;
    blockRef: RefObject<HTMLDivElement>;
    sourceHtml: string;
    onCommit: (html: string) => void;
    onEditingChange: (editing: boolean) => void;
}> = ({frameRef, blockRef, sourceHtml, onCommit, onEditingChange}) => {
    const [hover, setHover] = useState<Target | null>(null);
    const [selected, setSelected] = useState<Selection | null>(null);
    const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
    const selectedRef = useRef(selected);
    const dirtyRef = useRef(false);
    const nextSelectionId = useRef(0);
    selectedRef.current = selected;

    const isEditing = Boolean(selected);
    useEffect(() => {
        onEditingChange(isEditing);
        return () => onEditingChange(false);
    }, [isEditing, onEditingChange]);

    useEffect(() => {
        const frame = frameRef.current;
        const block = blockRef.current;
        if (!frame || !block) return undefined;
        let frameDocument: Document | null = null;
        let editableElements = new Map<Element, string>();

        let pendingMove: MouseEvent | null = null;
        let animationFrame = 0;

        const getTarget = (eventTarget: EventTarget | null): Element | null => {
            const body = frame.contentDocument?.body;
            if (!body || !eventTarget || !(eventTarget as Node).nodeType) return null;
            const node = eventTarget as Node;
            const element = (node.nodeType === 1 ? node : node.parentElement) as Element | null;
            const target = element?.closest('svg') ?? element;
            if (!target || target === body || !body.contains(target)) return null;
            return editableElements.has(target) ? target : null;
        };

        const resolve = (eventTarget: EventTarget | null): Target | null => {
            const target = getTarget(eventTarget);
            if (!target) return null;
            const blockRect = block.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const left = frameRect.left + targetRect.left - blockRect.left;
            const top = frameRect.top + targetRect.top - blockRect.top;
            const width = targetRect.width;
            const height = targetRect.height;

            return {
                element: target,
                attributes: editableElements.get(target) ?? '',
                anchor: {left, top, width, height},
                outline: {
                    left: frameRect.left + targetRect.left - HIGHLIGHT_PADDING,
                    top: frameRect.top + targetRect.top - HIGHLIGHT_PADDING,
                    width: width + HIGHLIGHT_PADDING * 2,
                    height: height + HIGHLIGHT_PADDING * 2,
                },
                button: {
                    left: frameRect.left + targetRect.left,
                    top: frameRect.top + targetRect.top,
                },
            };
        };

        const flushMove = () => {
            animationFrame = 0;
            const event = pendingMove;
            pendingMove = null;
            if (!event || selectedRef.current) return;
            const element = getTarget(event.target);
            const frameRect = frame.getBoundingClientRect();
            const pointerX = frameRect.left + event.clientX;
            const pointerY = frameRect.top + event.clientY;
            setHover((current) => {
                const left = Number(current?.button.left);
                const top = Number(current?.button.top);
                // Keep the card reachable without retaining a different hovered element.
                if (
                    current &&
                    (!element || current.element === element) &&
                    pointerX >= left - 24 &&
                    pointerX <= left + 240 &&
                    pointerY >= top - 24 &&
                    pointerY <= top + 80
                )
                    return current;
                if (!element) return null;
                const target = current?.element === element ? current : resolve(element);
                if (!target) return null;
                const button = {
                    left: clamp(pointerX + 16, 8, window.innerWidth - 248),
                    top: clamp(
                        pointerY + 80 < window.innerHeight ? pointerY + 16 : pointerY - 80,
                        8,
                        window.innerHeight - 80,
                    ),
                };
                if (current === target && button.left === left && button.top === top)
                    return current;
                return {...target, button};
            });
        };
        const cancelMove = () => {
            cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            pendingMove = null;
        };
        const onMove = (event: MouseEvent) => {
            if (selectedRef.current) return;
            pendingMove = event;
            if (!animationFrame) animationFrame = requestAnimationFrame(flushMove);
        };
        const onClick = (event: MouseEvent) => {
            cancelMove();
            if (selectedRef.current) {
                event.preventDefault();
                if (!dirtyRef.current) setSelected(null);
                return;
            }
            const target = resolve(event.target);
            if (!target) return;
            event.preventDefault();
            event.stopPropagation();
            setSelected({...target, id: ++nextSelectionId.current});
            setHover(null);
        };
        const onLeave = () => {
            cancelMove();
            setHover(null);
        };
        const reposition = () => {
            setSelected((current) => {
                const target = current && resolve(current.element);
                return target && current ? {...target, id: current.id} : null;
            });
            setHover((current) => {
                const target = current && resolve(current.element);
                return target && current ? {...target, button: current.button} : null;
            });
        };
        const onScroll = () => {
            onLeave();
            reposition();
        };
        const resizeObserver = new ResizeObserver(reposition);
        const connect = () => {
            cancelMove();
            resizeObserver.disconnect();
            resizeObserver.observe(block);
            if (frameDocument) {
                frameDocument.removeEventListener('mousemove', onMove);
                frameDocument.removeEventListener('click', onClick, true);
            }
            frameDocument = frame.contentDocument;
            const body = frameDocument?.body;
            const matching = body && getMatchingElements(sourceHtml, body);
            editableElements = new Map(
                matching
                    ? matching.previewElements.map((element, index) => [
                          element,
                          getElementAttributes(matching.sourceElements[index])
                              .map(({name, value}) => `${name}="${value}"`)
                              .join(' · '),
                      ])
                    : [],
            );
            frameDocument?.addEventListener('mousemove', onMove);
            frameDocument?.addEventListener('click', onClick, true);
            if (body) resizeObserver.observe(body);
            setHover(null);
            setSelected(null);
        };

        frame.addEventListener('load', connect);
        block.addEventListener('mouseleave', onLeave);
        window.addEventListener('scroll', onScroll, true);
        connect();
        return () => {
            cancelMove();
            frame.removeEventListener('load', connect);
            block.removeEventListener('mouseleave', onLeave);
            window.removeEventListener('scroll', onScroll, true);
            resizeObserver.disconnect();
            frameDocument?.removeEventListener('mousemove', onMove);
            frameDocument?.removeEventListener('click', onClick, true);
        };
    }, [blockRef, frameRef, sourceHtml]);

    const close = () => {
        dirtyRef.current = false;
        setSelected(null);
        setHover(null);
        blockRef.current?.focus({preventScroll: true});
    };

    const current = selected ?? hover;
    return (
        <>
            {current && (
                <Portal>
                    <div className={b('inline-edit-outline')} style={current.outline} />
                </Portal>
            )}
            {selected && (
                <div ref={setAnchor} className={b('inline-edit-anchor')} style={selected.anchor} />
            )}
            {hover && !selected && (
                <button
                    type="button"
                    className={`${b('inline-edit-button')} ${STOP_EVENT_CLASSNAME}`}
                    style={hover.button}
                    aria-label={i18n('edit_element')}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelected({...hover, id: ++nextSelectionId.current});
                        setHover(null);
                    }}
                >
                    <Icon data={Pencil} size={16} />
                    <span className={b('inline-edit-summary')}>
                        <code>{`<${hover.element.tagName.toLowerCase()}>`}</code>
                        {hover.attributes && (
                            <span className={b('inline-edit-summary-attrs')}>
                                {hover.attributes}
                            </span>
                        )}
                    </span>
                </button>
            )}
            {selected && anchor && frameRef.current?.contentDocument?.body && (
                <InlineElementEditor
                    key={selected.id}
                    sourceHtml={sourceHtml}
                    previewRoot={frameRef.current.contentDocument.body}
                    target={selected.element}
                    anchorElement={anchor}
                    onDirtyChange={(dirty) => {
                        dirtyRef.current = dirty;
                    }}
                    onCommit={onCommit}
                    onClose={close}
                />
            )}
        </>
    );
};
