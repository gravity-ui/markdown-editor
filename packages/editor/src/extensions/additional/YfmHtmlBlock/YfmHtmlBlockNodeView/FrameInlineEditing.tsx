import {useEffect, useRef, useState} from 'react';
import type {CSSProperties, RefObject} from 'react';

import {Pencil} from '@gravity-ui/icons';
import {Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-block';

import {InlineElementEditor} from './InlineElementEditor';
import {STOP_EVENT_CLASSNAME, cnYfmHtmlBlock as b} from './const';
import {getMatchingElements} from './textEditing';

interface Target {
    element: Element;
    outline: CSSProperties;
    button: CSSProperties;
}

interface Selection extends Target {
    id: number;
}

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
        let editableElements: Set<Element> | null = null;

        const resolve = (eventTarget: EventTarget | null): Target | null => {
            const body = frame.contentDocument?.body;
            if (!body || !eventTarget || !(eventTarget as Node).nodeType) return null;
            const node = eventTarget as Node;
            const element = (node.nodeType === 1 ? node : node.parentElement) as Element | null;
            const target = element?.closest('svg') ?? element;
            if (!target || target === body || !body.contains(target)) return null;
            if (!editableElements?.has(target)) return null;

            const blockRect = block.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const left = frameRect.left + targetRect.left - blockRect.left;
            const top = frameRect.top + targetRect.top - blockRect.top;
            const width = targetRect.width;
            const height = targetRect.height;

            return {
                element: target,
                outline: {left, top, width, height},
                button: {
                    left: clamp(left + width - 20, 4, blockRect.width - 36),
                    top: clamp(top - 8, 0, blockRect.height - 28),
                },
            };
        };

        const onMove = (event: MouseEvent) => {
            if (selectedRef.current) return;
            const target = resolve(event.target);
            setHover((current) =>
                current?.element === target?.element &&
                current?.outline.left === target?.outline.left &&
                current?.outline.top === target?.outline.top &&
                current?.outline.width === target?.outline.width &&
                current?.outline.height === target?.outline.height
                    ? current
                    : target,
            );
        };
        const onClick = (event: MouseEvent) => {
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
        const onLeave = () => setHover(null);
        const reposition = () => {
            setSelected((current) => {
                const target = current && resolve(current.element);
                return target && current ? {...target, id: current.id} : null;
            });
            setHover((current) => (current ? resolve(current.element) : null));
        };
        const resizeObserver = new ResizeObserver(reposition);
        const connect = () => {
            resizeObserver.disconnect();
            resizeObserver.observe(block);
            if (frameDocument) {
                frameDocument.removeEventListener('mousemove', onMove);
                frameDocument.removeEventListener('click', onClick, true);
            }
            frameDocument = frame.contentDocument;
            const body = frameDocument?.body;
            editableElements = body
                ? new Set(getMatchingElements(sourceHtml, body)?.previewElements)
                : null;
            frameDocument?.addEventListener('mousemove', onMove);
            frameDocument?.addEventListener('click', onClick, true);
            if (body) resizeObserver.observe(body);
            setHover(null);
            setSelected(null);
        };

        frame.addEventListener('load', connect);
        block.addEventListener('mouseleave', onLeave);
        connect();
        return () => {
            frame.removeEventListener('load', connect);
            block.removeEventListener('mouseleave', onLeave);
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
                <div
                    ref={selected ? setAnchor : undefined}
                    className={b('inline-edit-outline')}
                    style={current.outline}
                />
            )}
            {hover && !selected && (
                <button
                    type="button"
                    className={`${b('inline-edit-button')} ${STOP_EVENT_CLASSNAME}`}
                    style={hover.button}
                    aria-label={i18n('edit_element')}
                    title={i18n('edit_element')}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelected({...hover, id: ++nextSelectionId.current});
                        setHover(null);
                    }}
                >
                    <Icon data={Pencil} size={15} />
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
