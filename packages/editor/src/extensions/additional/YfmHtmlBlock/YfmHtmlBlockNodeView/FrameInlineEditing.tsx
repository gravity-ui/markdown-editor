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

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, Math.max(min, max)));

export const FrameInlineEditing: React.FC<{
    frameRef: RefObject<HTMLIFrameElement>;
    blockRef: RefObject<HTMLDivElement>;
    sourceHtml: string;
    onCommit: (html: string) => void;
}> = ({frameRef, blockRef, sourceHtml, onCommit}) => {
    const [hover, setHover] = useState<Target | null>(null);
    const [selected, setSelected] = useState<Target | null>(null);
    const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
    const selectedRef = useRef(selected);
    selectedRef.current = selected;

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return undefined;
        let frameDocument: Document | null = null;

        const resolve = (eventTarget: EventTarget | null): Target | null => {
            const body = frame.contentDocument?.body;
            const block = blockRef.current;
            if (!body || !block || !eventTarget || !(eventTarget as Node).nodeType) return null;
            const node = eventTarget as Node;
            const element = (node.nodeType === 1 ? node : node.parentElement) as Element | null;
            const target = element?.closest('svg') ?? element;
            if (!target || target === body || !body.contains(target)) return null;
            const matching = getMatchingElements(sourceHtml, body);
            if (!matching?.previewElements.includes(target)) return null;

            const blockRect = block.getBoundingClientRect();
            const frameRect = frame.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const left = Math.max(0, frameRect.left + targetRect.left - blockRect.left - 4);
            const top = Math.max(0, frameRect.top + targetRect.top - blockRect.top - 4);
            const width = targetRect.width + 8;
            const height = targetRect.height + 8;

            return {
                element: target,
                outline: {left, top, width, height},
                button: {
                    left: clamp(left + width - 20, 4, blockRect.width - 28),
                    top: clamp(top - 8, 0, blockRect.height - 28),
                },
            };
        };

        const onMove = (event: MouseEvent) => {
            if (selectedRef.current) return;
            const target = resolve(event.target);
            setHover((current) => (current?.element === target?.element ? current : target));
        };
        const onClick = (event: MouseEvent) => {
            if (selectedRef.current) {
                event.preventDefault();
                return;
            }
            const target = resolve(event.target);
            if (!target) return;
            event.preventDefault();
            event.stopPropagation();
            setSelected(target);
            setHover(null);
        };
        const connect = () => {
            if (frameDocument) {
                frameDocument.removeEventListener('mousemove', onMove);
                frameDocument.removeEventListener('click', onClick, true);
            }
            frameDocument = frame.contentDocument;
            frameDocument?.addEventListener('mousemove', onMove);
            frameDocument?.addEventListener('click', onClick, true);
            setHover(null);
            setSelected(null);
        };

        frame.addEventListener('load', connect);
        connect();
        return () => {
            frame.removeEventListener('load', connect);
            frameDocument?.removeEventListener('mousemove', onMove);
            frameDocument?.removeEventListener('click', onClick, true);
        };
    }, [blockRef, frameRef, sourceHtml]);

    const close = () => {
        setSelected(null);
        setHover(null);
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
                    onClick={() => {
                        setSelected(hover);
                        setHover(null);
                    }}
                >
                    <Icon data={Pencil} size={15} />
                </button>
            )}
            {selected && frameRef.current?.contentDocument?.body && (
                <InlineElementEditor
                    key={selected.element.tagName + selected.element.getAttributeNames().join(',')}
                    sourceHtml={sourceHtml}
                    previewRoot={frameRef.current.contentDocument.body}
                    target={selected.element}
                    anchorElement={anchor}
                    returnFocus={blockRef}
                    onCommit={onCommit}
                    onClose={close}
                />
            )}
        </>
    );
};
